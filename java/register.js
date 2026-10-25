const form = document.getElementById("register-form");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const lowerCaseLetter = /[a-z]/;
  const upperCaseLetter = /[A-Z]/;
  const numbers = /[0-9]/;

  if (username.length < 6) {
    alert("Tài khoản phải ít nhất 6 ký tự.");
    return;
  }
  if (password.length < 8) {
    alert("Mật khẩu phải ít nhất 8 ký tự.");
    return;
  }
  if (!lowerCaseLetter.test(password)) {
    alert("Mật khẩu phải có kí tự viết thường.");
    return;
  }
  if (!upperCaseLetter.test(password)) {
    alert("Mật khẩu phải có kí tự viết hoa.");
    return;
  }
  if (!numbers.test(password)) {
    alert("Mật khẩu phải có kí tự số.");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users")) || [];

  const emailExists = users.find((user) => user.email === email);
  if (emailExists) {
    alert("Email này đã được đăng ký.");
    return;
  }

  const newUser = { username, email, password };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  alert("Tạo tài khoản thành công! Hãy đăng nhập.");
  location.href = "./login.html";
});
