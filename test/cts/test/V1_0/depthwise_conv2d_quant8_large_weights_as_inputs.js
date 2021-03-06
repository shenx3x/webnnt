describe('CTS', function() {
  const assert = chai.assert;
  const nn = navigator.ml.getNeuralNetworkContext();

  it('check result for Depthwise conv2d quant8 large weights as inputs example', async function() {
    let model = await nn.createModel(options);
    let operandIndex = 0;

    let op1_value = [4, 16, 4, 32, 4, 64, 4, 128];
    let op2_value = [2, 4, 2, 0, 2, 2, 2, 0];
    let op3_value = [0, 0];
    let op4_expect = [8, 48];

    let type2 = {type: nn.INT32};
    let type1 = {type: nn.TENSOR_INT32, dimensions: [2], scale: 0.25, zeroPoint: 0};
    let type1_length = product(type1.dimensions);
    let type3 = {type: nn.TENSOR_QUANT8_ASYMM, dimensions: [1, 1, 1, 2], scale: 1., zeroPoint: 0};
    let type3_length = product(type3.dimensions);
    let type0 = {type: nn.TENSOR_QUANT8_ASYMM, dimensions: [1, 2, 2, 2], scale: 0.5, zeroPoint: 0};
    let type0_length = product(type0.dimensions);

    let op1 = operandIndex++;
    model.addOperand(type0);
    let op2 = operandIndex++;
    model.addOperand(type0);
    let op3 = operandIndex++;
    model.addOperand(type1);
    let pad0 = operandIndex++;
    model.addOperand(type2);
    let act = operandIndex++;
    model.addOperand(type2);
    let stride = operandIndex++;
    model.addOperand(type2);
    let channelMultiplier = operandIndex++;
    model.addOperand(type2);
    let op4 = operandIndex++;
    model.addOperand(type3);

    let op2_input = new Uint8Array(op2_value);
    model.setOperandValue(op2, op2_input);

    let op3_input = new Int32Array(op3_value);
    model.setOperandValue(op3, op3_input);

    model.setOperandValue(pad0, new Int32Array([0]));
    model.setOperandValue(act, new Int32Array([0]));
    model.setOperandValue(stride, new Int32Array([1]));
    model.setOperandValue(channelMultiplier, new Int32Array([1]));
    model.addOperation(nn.DEPTHWISE_CONV_2D, [op1, op2, op3, pad0, pad0, pad0, pad0, stride, stride, channelMultiplier, act], [op4]);

    model.identifyInputsAndOutputs([op1], [op4]);
    await model.finish();

    let compilation = await model.createCompilation();
    compilation.setPreference(getPreferenceCode(options.prefer));
    await compilation.finish();

    let execution = await compilation.createExecution();

    let op1_input = new Uint8Array(op1_value);
    execution.setInput(0, op1_input);

    let op4_output = new Uint8Array(type3_length);
    execution.setOutput(0, op4_output);

    await execution.startCompute();

    for (let i = 0; i < type3_length; ++i) {
      assert.isTrue(almostEqualCTS(op4_output[i], op4_expect[i]));
    }
  });
});
