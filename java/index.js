// ===== Bắt buộc đăng nhập =====
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser) {
  window.location.href = "./login.html";
}

// ===== Hiển thị tên người dùng =====
const welcomeText = document.getElementById("welcome-text");
if (welcomeText && currentUser) {
  welcomeText.textContent = `Xin chào, ${currentUser.username}`;
}

// ===== Nút đăng xuất =====
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.removeItem("currentUser");
    window.location.href = "./login.html";
  });
}
