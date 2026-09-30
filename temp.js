// Online JavaScript compiler (editor)
// Write and run JavaScript online using this JS editor.

function sum(a, b) {
  return a + b;
}

function calculator(a, b, sumCallback) {
  return sumCallback(a, b);
}

function getData(id) {
  setTimeout(getData(), 2000);
}

getData(2);
