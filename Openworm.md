1. Solucan Hareket Sistemi (Sadeleştirilmiş)
Kullanılacak Inputlar
sensoryInputs: number[] — Solucanın hareketini belirleyecek inputlar. Senin oyununda bu inputlar rastgele veya oyun içi başka bir mantıkla üretilebilir.
Örnek: [random1, random2, random3] gibi.

// Aktivasyon fonksiyonları
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}
function relu(x: number): number {
  return Math.max(0, x);
}
function tanh(x: number): number {
  return Math.tanh(x);
}
function softmax(outputs: number[]): number[] {
  const maxOutput = Math.max(...outputs);
  const expOutputs = outputs.map(output => Math.exp(output - maxOutput));
  const sumExpOutputs = expOutputs.reduce((sum, val) => sum + val, 0);
  return expOutputs.map(val => val / sumExpOutputs);
}

// Nöron sınıfı
class Neuron {
  weights: number[];
  bias: number;
  activation: number;
  activationFunction: (x: number) => number;

  constructor(weights: number[], bias: number = 0, activationFunction?: (x: number) => number) {
    this.weights = weights;
    this.bias = bias;
    this.activation = 0;
    this.activationFunction = activationFunction || sigmoid;
  }

  activate(inputs: number[]): number {
    if (inputs.length !== this.weights.length) {
      throw new Error("Input and weight vectors must be of the same length.");
    }
    const weightedSum = inputs.reduce(
      (sum, input, idx) => sum + input * this.weights[idx],
      this.bias
    );
    this.activation = this.activationFunction(weightedSum);
    return this.activation;
  }
}

// Hareket yönünü belirleyen ana fonksiyon
function getWormNextDirection(sensoryInputs: number[]): "up" | "down" | "left" | "right" {
  // Katmanlar (örnek sabit ağırlıklar, istersen random veya başka şekilde üretebilirsin)
  const sensoryNeurons = [
    new Neuron([1, 0, 0], 0, relu),
    new Neuron([0, 1, 0], 0, relu),
    new Neuron([0, 0, 1], 0, relu),
  ];
  const hiddenLayer1 = [
    new Neuron([0.5, -0.3, 0.2], 0.1, tanh),
    new Neuron([-0.4, 0.6, -0.1], -0.2, relu),
    new Neuron([0.3, 0.3, 0.3], 0.01, sigmoid),
    new Neuron([-0.2, 0.8, -0.5], 0.05, tanh),
  ];
  const hiddenLayer2 = [
    new Neuron([0.7, -0.5, 0.4, 0.1], 0.05, relu),
    new Neuron([-0.6, 0.9, -0.3, 0.2], -0.1, sigmoid),
    new Neuron([0.2, 0.2, 0.6, -0.4], 0.2, tanh),
    new Neuron([0.1, -0.2, 0.5, 0.3], -0.05, relu),
  ];
  const hiddenLayer3 = [
    new Neuron([0.4, -0.6, 0.3, 0.2], 0.03, sigmoid),
    new Neuron([-0.5, 0.7, -0.2, 0.4], -0.07, tanh),
    new Neuron([0.3, 0.1, 0.5, -0.3], 0.1, relu),
    new Neuron([0.2, 0.2, 0.2, 0.2], 0.01, sigmoid),
  ];
  // Motor nöronlar (her biri bir yönü temsil eder)
  const motorNeurons = [
    new Neuron([0.1, 0.2, 0.3, 0.4], 0, sigmoid), // up
    new Neuron([0.2, 0.1, 0.4, 0.3], 0, sigmoid), // down
    new Neuron([0.3, 0.4, 0.1, 0.2], 0, sigmoid), // left
    new Neuron([0.4, 0.3, 0.2, 0.1], 0, sigmoid), // right
  ];

  // Katmanları sırayla uygula
  let inputs = sensoryInputs;
  [sensoryNeurons, hiddenLayer1, hiddenLayer2, hiddenLayer3, motorNeurons].forEach(layer => {
    const outputs: number[] = [];
    layer.forEach(neuron => {
      outputs.push(neuron.activate(inputs));
    });
    inputs = outputs;
  });

  // Sonuçlardan yönü seç
  const directions = ["up", "down", "left", "right"] as const;
  const motorActivations = softmax(inputs);
  const maxActivation = Math.max(...motorActivations);
  const direction = directions[motorActivations.indexOf(maxActivation)];
  return direction;
}

// Pozisyonu güncelleyen fonksiyon
function getNextPosition(current: {x: number, y: number}, direction: "up" | "down" | "left" | "right") {
  switch (direction) {
    case "up": return { x: current.x, y: current.y + 1 };
    case "down": return { x: current.x, y: current.y - 1 };
    case "left": return { x: current.x - 1, y: current.y };
    case "right": return { x: current.x + 1, y: current.y };
  }
}



2. Kullanım Örneği


// Başlangıç pozisyonu
let worm = { x: 0, y: 0 };

// Her hareket adımında:
const sensoryInputs = [
  Math.random(), // input 1 (ör: rastgele veya oyun içi bir değer)
  Math.random(), // input 2
  Math.random(), // input 3
];
const direction = getWormNextDirection(sensoryInputs);
worm = getNextPosition(worm, direction);
console.log(worm, direction);


3. Input Alanları
sensoryInputs: Buraya oyununda solucanın hareketini etkileyecek inputları (ör: rastgele değerler, oyuncu hareketleri, harita durumu vs.) verebilirsin.
Katman ağırlıklarını istersen sabit, istersen random veya başka bir şekilde üretebilirsin.