const patterns = {
  название_тсп: /Название\s+ТСП:\s*(.*?),/i,
  merchant_id: /MerchantID\s*:\s*(\S+)/i,
  тип_терминала: /Тип\s+терминала\s*:\s*(\S+)/i,
  terminal_id: /Terminal_ID\s*:\s*(\d+)/i,
};
const specificFields = {
  номер_счета: "Номер счета юр. лица",
  алиас_счета: "Алиас счета юр. лица",
  идентификатор_тсп: "Идентификатор ТСП",
  id_платформы: "ID платформы",
  город_адрес: "Адрес",
};
const translitMap = {
  A: "А",
  B: "Б",
  V: "В",
  G: "Г",
  D: "Д",
  E: "Е",
  EO: "Ё",
  ZH: "Ж",
  Z: "З",
  I: "И",
  Y: "Й",
  K: "К",
  L: "Л",
  M: "М",
  N: "Н",
  O: "О",
  P: "П",
  R: "Р",
  S: "С",
  T: "Т",
  U: "У",
  F: "Ф",
  H: "Х",
  KH: "Х",
  C: "Ц",
  TS: "Ц",
  CH: "Ч",
  SH: "Ш",
  SCH: "Щ",
  YU: "Ю",
  YA: "Я",
  J: "ДЖ",
  W: "В",
  Q: "КВ",
  KY: "КИЙ",
};

function transliterateToRussian(text) {
  text = text.toUpperCase();
  return text
    .replace(/(SH|KH|ZH|TS|CH|SCH|KY|YU|YA)/g, (match) => translitMap[match] || match)
    .replace(/[A-Z]/g, (char) => translitMap[char] || char);
}

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

function extractData() {
  const inputText = document.getElementById('inputText').value;
  const result = {};
  const outputDiv = document.getElementById('outputResult');
  outputDiv.innerHTML = '';

  // Очистка поля "Описание неисправности", если фраза отсутствует
  const faultDescriptionElement = document.getElementById('faultDescription');
  if (!inputText.includes("Описание неисправности")) {
      faultDescriptionElement.innerHTML = "";
  }

  // Первая строка возвращается полностью
  const firstLine = inputText.split('\n')[0].trim();
  result['первая_строка'] = firstLine;

  // Извлечение SSID и Password из первой строки
  const ssidMatch = firstLine.match(/SSID:\s*(\S+)/i);
  const passwordMatch = firstLine.match(/Password:\s*(\S+)/i);

  let ssid = ssidMatch ? ssidMatch[1].trim() : null;
  let password = passwordMatch ? passwordMatch[1].trim() : null;

  // Удаляем кавычку в конце Password, если она есть
  if (password && password.endsWith('"')) {
      password = password.slice(0, -1).trim();
  }

  // Удаляем SSID и Password из первой строки
  let filteredFirstLine = firstLine;
  if (ssid) {
      filteredFirstLine = filteredFirstLine.replace(ssidMatch[0], '').trim();
  }
  if (password) {
      filteredFirstLine = filteredFirstLine.replace(passwordMatch[0], '').trim();
  }

  result['первая_строка'] = filteredFirstLine;

  // Извлечение данных для первого юр.лица
  for (const [key, pattern] of Object.entries(patterns)) {
      const match = inputText.match(pattern);
      result[key] = match ? match[1].trim() : null;
  }

  for (const [key, label] of Object.entries(specificFields)) {
      if (label === "Номер счета юр. лица") {
          result['номер_счета'] = extractNumberAfterLabel(inputText, "Номер счета юридического лица");
      } else if (label === "Алиас счета юр. лица") {
          result['алиас_счета'] = extractAlias(inputText, "Алиас счета юридического лица (синоним счета)");
      } else if (label === "Идентификатор ТСП") {
          result['идентификатор_тсп'] = extractBetweenLabels(inputText, "Идентификатор ТСП", "ID платформы");
      } else if (label === "ID платформы") {
          result['id_платформы'] = extractAfterLabel(inputText, "ID платформы");
      } else if (label === "Адрес") {
          result['город_адрес'] = extractCityAndAddress(inputText, inputText);
      }
  }

  // Добавляем SSID и Password в результаты, если они найдены
  if (ssid) {
      result['ssid'] = ssid;
  }
  if (password) {
      result['password'] = password;
  }

  // Отображение результатов для первого юр.лица
  displayResults(result, outputDiv);

  // Извлечение описания неисправности
  const faultDescription = extractBetweenLabels(inputText, "Описание неисправности", "Регистрационные данные");
  faultDescriptionElement.innerHTML = faultDescription
      ? highlightKeywords(faultDescription)
      : "Не указано";

  // Обработка второго юр.лица
  const secondEntityStart = inputText.indexOf("2 юр. лицо:");
  if (secondEntityStart !== -1) {
      const secondEntityText = inputText.substring(secondEntityStart); // Берем часть текста после "2 юр. лицо:"
      const secondEntityData = extractSecondEntityData(secondEntityText); // Извлекаем данные второго юр.лица
      if (Object.values(secondEntityData).some(value => value !== null)) { // Проверяем, есть ли данные
          displaySecondEntityResults(secondEntityData, outputDiv); // Выводим результаты
      }
  }
}

function extractNumberAfterLabel(text, label) {
  const startIndex = text.indexOf(label);
  if (startIndex === -1) return null;
  const lineStart = text.slice(0, startIndex).lastIndexOf("\n") + 1;
  const lineEnd =
    text.indexOf("\n", startIndex) !== -1
      ? text.indexOf("\n", startIndex)
      : text.length;
  const line = text.substring(lineStart, lineEnd);
  const numberMatch = line.match(/\d+/);
  return numberMatch ? numberMatch[0] : null;
}

function extractAlias(text, label) {
  const startIndex = text.indexOf(label);
  if (startIndex === -1) return null;
  const closingParenthesisIndex = text.indexOf(")", startIndex);
  if (closingParenthesisIndex === -1) return null;
  let aliasStart = closingParenthesisIndex + 1;
  while (aliasStart < text.length && text[aliasStart].trim() === "")
    aliasStart++;
  const aliasEnd = aliasStart + (text[aliasStart + 44 - 1] === "=" ? 44 : 36);
  return text.substring(aliasStart, aliasEnd).trim();
}

function extractBetweenLabels(text, startLabel, endLabel) {
  const startIndex = text.indexOf(startLabel);
  const endIndex = text.indexOf(endLabel);
  return startIndex !== -1 && endIndex !== -1
    ? text.substring(startIndex + startLabel.length, endIndex).trim()
    : null;
}

function extractAfterLabel(text, label) {
  const startIndex = text.indexOf(label);
  if (startIndex === -1) return null;
  const lineEnd =
    text.indexOf("\n", startIndex) !== -1
      ? text.indexOf("\n", startIndex)
      : text.length;
  return text.substring(startIndex + label.length, lineEnd).trim();
}

function extractCityAndAddress(text, fullText) {
  const cityLabel = "Город:";
  const addressLabel = "Адрес установки:";
  const city = extractAfterLabel(text, cityLabel);
  const address = extractAfterLabel(text, addressLabel);
  if (!city && !address) return null;
  const transliteratedCity = transliterateToRussian(city);
  const transliteratedAddress = transliterateToRussian(address);
  const isCityFound = fullText
    .toLowerCase()
    .includes(transliteratedCity.toLowerCase());
  const isAddressFound = fullText
    .toLowerCase()
    .includes(transliteratedAddress.toLowerCase());
  let cityOutput = transliteratedCity;
  let addressOutput = transliteratedAddress;
  if (!isCityFound)
    cityOutput = `<span class="attention">${transliteratedCity}</span>`;
  if (!isAddressFound)
    addressOutput = `<span class="attention">${transliteratedAddress}</span>`;
  return `${cityOutput}, ${addressOutput}`;
}

function displayResults(data, outputDiv) {
  const fields = [
      { label: "", value: data['первая_строка'], type: "text" }
  ];

  // Добавляем SSID и Password только если Password существует
  if (data['password']) {
      fields.push({ label: "SSID", value: data['ssid'], type: "button" });
      fields.push({ label: "Password", value: data['password'], type: "button" });
  }

  // Остальные поля
  fields.push(
      { label: "Тип терминала", value: data['тип_терминала'], type: "text" },
      { label: "ТСП", value: data['название_тсп']?.split(',')[0].trim(), type: "button" },
      { label: "MID", value: data['merchant_id'], type: "button" },
      { label: "ID платформы", value: data['id_платформы'], type: "button" },
      { label: "TID", value: data['terminal_id'], type: "button" },
      { label: "Идентификатор ТСП", value: data['идентификатор_тсп'], type: "button" },
      { label: "Номер счета юр. лица", value: data['номер_счета'], type: "button" },
      { label: "Алиас счета юр. лица", value: data['алиас_счета'], type: "button" },
      { label: "Адрес", value: data['город_адрес'], type: "button" }
  );

  fields.forEach(field => {
      if (field.value === null || field.value === "Не указано") return; // Пропускаем пустые значения

      // Если поле "ТСП" и значение отсутствует, пропускаем его
      if (field.label === "ТСП" && !data['название_тсп']) return;

      // Если поле "Адрес" и данные отсутствуют, пропускаем его
      if (field.label === "Адрес" && data['город_адрес'] === null) return;

      const itemDiv = document.createElement('div');
      itemDiv.className = 'result-item';

      if (field.label) {
          const labelSpan = document.createElement('span');
          labelSpan.textContent = `${field.label}:`;
          itemDiv.appendChild(labelSpan);
      }

      if (field.type === "button") {
          const button = document.createElement('button');
          button.innerHTML = field.value;
          button.onclick = () => copyToClipboard(button);
          itemDiv.appendChild(button);
      } else {
          const textElement = document.createElement('span');
          textElement.innerHTML = field.value;
          itemDiv.appendChild(textElement);
      }

      outputDiv.appendChild(itemDiv);
  });
}

function extractSecondEntityData(text) {
  const secondEntityPatterns = {
      название_тсп: /Название\s+ТСП:\s*(.*?),/i, // Извлекаем название ТСП
      merchant_id: /MerchantID\s*:\s*(\S+)/i,   // Извлекаем MID
      terminal_id: /Terminal_ID\s*:\s*(\d+)/i,  // Извлекаем TID
      tpk_key: /TPK_KEY\s*:\s*(\S+)/i,          // Извлекаем TPK_KEY
      tak_key: /TAK_KEY\s*:\s*(\S+)/i,          // Извлекаем TAK_KEY
      tdk_key: /TDK_KEY\s*:\s*(\S+)/i           // Извлекаем TDK_KEY
  };

  const data = {};
  for (const [key, pattern] of Object.entries(secondEntityPatterns)) {
      const match = text.match(pattern); // Проверяем соответствие паттерну
      data[key] = match && match[1] ? match[1].trim() : null; // Сохраняем найденное значение
  }
  return data;
}

function displaySecondEntityResults(data, outputDiv) {
  if (!data || Object.values(data).every(value => value === null)) return; // Пропускаем, если нет данных

  // Создаем заголовок для второго юр.лица
  const secondEntityHeader = document.createElement('h3');
  secondEntityHeader.textContent = "2 юр.лицо";
  outputDiv.appendChild(secondEntityHeader);

  // Определяем поля для второго юр.лица
  const fields = [
      { label: "ТСП", value: data['название_тсп']?.split(',')[0].trim(), type: "button" },
      { label: "MID", value: data['merchant_id'], type: "button" },
      { label: "TID", value: data['terminal_id'], type: "button" },
      { label: "TPK_KEY", value: data['tpk_key'], type: "button" },
      { label: "TAK_KEY", value: data['tak_key'], type: "button" },
      { label: "TDK_KEY", value: data['tdk_key'], type: "button" }
  ];

  // Отображаем каждый пункт
  fields.forEach(field => {
      if (field.value === null || field.value === "Не указано") return; // Пропускаем пустые значения

      const itemDiv = document.createElement('div'); // Создаем элемент для каждого пункта
      itemDiv.className = 'result-item'; // Добавляем класс для стилей

      if (field.label) {
          const labelSpan = document.createElement('span'); // Создаем метку
          labelSpan.textContent = `${field.label}:`;
          itemDiv.appendChild(labelSpan); // Добавляем метку в элемент
      }

      if (field.type === "button") {
          const button = document.createElement('button'); // Создаем кнопку
          button.innerHTML = field.value;
          button.onclick = () => copyToClipboard(button); // Добавляем обработчик для копирования
          itemDiv.appendChild(button); // Добавляем кнопку в элемент
      } else {
          const textElement = document.createElement('span'); // Создаем текстовый элемент
          textElement.innerHTML = field.value;
          itemDiv.appendChild(textElement); // Добавляем текст в элемент
      }

      outputDiv.appendChild(itemDiv); // Добавляем элемент в контейнер результатов
  });
}

function copyToClipboard(button) {
  navigator.clipboard.writeText(button.textContent).then(() => {
    button.classList.add("copied");
    setTimeout(() => button.classList.remove("copied"), 3000);
  });
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-theme");
  saveTheme(isDark ? "dark" : "light");
}

function highlightKeywords(text) {
  const keywords = [
    "ВНИМАНИЕ",
    "МУЛЬТИМЕРЧАНТ",
    "ЭЛЕКТРОННЫМИ СЕРТИФИКАТАМИ",
    "ОБРАТНОГО ЭКВАЙРИНГА",
    "ОЭ",
    "ЭС",
    "Фармленд",
    "ФАРМЛЕНД"
  ];
  keywords.forEach((keyword) => {
    const regex = new RegExp(`(${keyword})`, "gi");
    text = text.replace(regex, '<span class="attention">$1</span>');
  });
  return text;
}

// Загрузка темы при загрузке страницы
loadTheme();
