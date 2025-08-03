function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    document.getElementById("themeToggle").checked = true;
  }
}

function saveTheme(theme) {
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-theme");
  saveTheme(isDark ? "dark" : "light");
}

// Инициализация темы при загрузке
document.addEventListener('DOMContentLoaded', loadTheme);