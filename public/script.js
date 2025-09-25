function sanitizeInput(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

document.getElementById("applyForm").addEventListener("submit", function(e) {
  let name = sanitizeInput(document.getElementById("name").value.trim());
  let email = sanitizeInput(document.getElementById("email").value.trim());
  let resume = sanitizeInput(document.getElementById("resume").value.trim());

  if (name === "" || email === "" || resume === "") {
    alert("All fields are required!");
    e.preventDefault();
    return;
  }

  if (!email.includes("@")) {
    alert("Enter a valid email address!");
    e.preventDefault();
    return;
  }

  // Send sanitized data to backend using fetch
  fetch("http://localhost:2000/api/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, resume })
  })
  .then(res => res.json())
  .then(data => alert(data.message))
  .catch(err => console.error(err));

  e.preventDefault(); // prevent default form submission
});
