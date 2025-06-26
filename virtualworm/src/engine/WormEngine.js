// Openworm hareket motoru - sadeleştirilmiş

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}
function relu(x) {
  return Math.max(0, x);
}
function tanh(x) {
  return Math.tanh(x);
}
function softmax(outputs) {
  const maxOutput = Math.max(...outputs);
  const expOutputs = outputs.map(output => Math.exp(output - maxOutput));
  const sumExpOutputs = expOutputs.reduce((sum, val) => sum + val, 0);
  return expOutputs.map(val => val / sumExpOutputs);
}

class Neuron {
  constructor(weights, bias = 0, activationFunction = sigmoid) {
    this.weights = weights;
    this.bias = bias;
    this.activation = 0;
    this.activationFunction = activationFunction;
  }
  activate(inputs) {
    if (inputs.length !== this.weights.length) {
      throw new Error('Input and weight vectors must be of the same length.');
    }
    const weightedSum = inputs.reduce(
      (sum, input, idx) => sum + input * this.weights[idx],
      this.bias
    );
    this.activation = this.activationFunction(weightedSum);
    return this.activation;
  }
}

export default class WormEngine {
  constructor() {
    // Katmanlar (örnek sabit ağırlıklar)
    this.sensoryNeurons = [
      new Neuron([1, 0, 0], 0, relu),
      new Neuron([0, 1, 0], 0, relu),
      new Neuron([0, 0, 1], 0, relu),
    ];
    this.hiddenLayer1 = [
      new Neuron([0.5, -0.3, 0.2], 0.1, tanh),
      new Neuron([-0.4, 0.6, -0.1], -0.2, relu),
      new Neuron([0.3, 0.3, 0.3], 0.01, sigmoid),
      new Neuron([-0.2, 0.8, -0.5], 0.05, tanh),
    ];
    this.hiddenLayer2 = [
      new Neuron([0.7, -0.5, 0.4, 0.1], 0.05, relu),
      new Neuron([-0.6, 0.9, -0.3, 0.2], -0.1, sigmoid),
      new Neuron([0.2, 0.2, 0.6, -0.4], 0.2, tanh),
      new Neuron([0.1, -0.2, 0.5, 0.3], -0.05, relu),
    ];
    this.hiddenLayer3 = [
      new Neuron([0.4, -0.6, 0.3, 0.2], 0.03, sigmoid),
      new Neuron([-0.5, 0.7, -0.2, 0.4], -0.07, tanh),
      new Neuron([0.3, 0.1, 0.5, -0.3], 0.1, relu),
      new Neuron([0.2, 0.2, 0.2, 0.2], 0.01, sigmoid),
    ];
    this.motorNeurons = [
      new Neuron([0.1, 0.2, 0.3, 0.4], 0, sigmoid), // up
      new Neuron([0.2, 0.1, 0.4, 0.3], 0, sigmoid), // down
      new Neuron([0.3, 0.4, 0.1, 0.2], 0, sigmoid), // left
      new Neuron([0.4, 0.3, 0.2, 0.1], 0, sigmoid), // right
    ];
    this.directions = ['up', 'down', 'left', 'right'];
    this.speed = 60; // px/s, smooth hareket için hız (50% azaltıldı)
    this.lastDirection = null;
  }

  getWormNextDirection(sensoryInputs) {
    let inputs = sensoryInputs;
    [this.sensoryNeurons, this.hiddenLayer1, this.hiddenLayer2, this.hiddenLayer3, this.motorNeurons].forEach(layer => {
      const outputs = [];
      layer.forEach(neuron => {
        outputs.push(neuron.activate(inputs));
      });
      inputs = outputs;
    });
    const motorActivations = softmax(inputs);
    const maxActivation = Math.max(...motorActivations);
    const direction = this.directions[motorActivations.indexOf(maxActivation)];
    this.lastDirection = direction;
    return direction;
  }

  // Akışkan hareket ve sınır kontrolü
  getNextPosition(current, direction, deltaTime, bounds) {
    const speed = this.speed; // px/s
    const step = speed * deltaTime; // deltaTime: saniye cinsinden
    let next = { ...current };
    switch (direction) {
      case 'up': next.y += step; break;    // Openworm.md: y artar
      case 'down': next.y -= step; break; // Openworm.md: y azalır
      case 'left': next.x -= step; break;
      case 'right': next.x += step; break;
      default: break;
    }
    // Sınır kontrolü
    if (next.x < bounds.minX) next.x = bounds.minX;
    if (next.x > bounds.maxX) next.x = bounds.maxX;
    if (next.y < bounds.minY) next.y = bounds.minY;
    if (next.y > bounds.maxY) next.y = bounds.maxY;
    // Eğer sınırda ve o yöne gitmek istiyorsa, pozisyonu değiştirme
    if ((current.x === bounds.minX && direction === 'left') ||
        (current.x === bounds.maxX && direction === 'right') ||
        (current.y === bounds.minY && direction === 'down') || // dikkat!
        (current.y === bounds.maxY && direction === 'up')) {   // dikkat!
      return { ...current };
    }
    return next;
  }
} 