async function check() {
  const res = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyCxPcvTh3VZR9jEGwbC8iN7vmY80h8Augw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test3@example.com", password: "password123", returnSecureToken: true })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
check();
