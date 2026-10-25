const form = document.getElementById("login-form");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.length === 0) {
    alert("Chưa có tài khoản nào. Vui lòng đăng ký trước!");
    return;
  }

  const existingUser = users.find(
    (user) => user.email === email && user.password === password,
  );

  if (!existingUser) {
    alert("Email hoặc mật khẩu không đúng.");
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(existingUser));
  location.href = "./index.html";
});
