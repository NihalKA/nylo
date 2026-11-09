const result = http.get("http://localhost:8766/" + PHASE);
output.backgroundReady = JSON.parse(result.body).ready === true;
