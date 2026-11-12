// Project CI runner only: inject both native taps in one timed sequence.
var response = http.post("http://127.0.0.1:8766/double-tap", { body: "{}" });
if (response.status !== 200) {
  throw new Error("Native image double-tap injection failed: " + response.body);
}
