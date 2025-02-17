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
    .replace(/(SH|KH|ZH|CH|SCH|KY|YU|YA)/g, (match) => translitMap[match] || match)
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
  const inputText = document.getElementById("inputText").value;
  const result = {};
  const outputDiv = document.getElementById("outputResult");
  outputDiv.innerHTML = "";

  const faultDescriptionElement = document.getElementById("faultDescription");
  if (!inputText.includes("Описание неисправности")) {
    faultDescriptionElement.innerHTML = "";
  }

  const firstLine = inputText.split("\n")[0].trim();
  result["первая_строка"] = firstLine;

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = inputText.match(pattern);
    result[key] = match ? match[1].trim() : null;
  }

  for (const [key, label] of Object.entries(specificFields)) {
    if (label === "Номер счета юр. лица") {
      result["номер_счета"] = extractNumberAfterLabel(
        inputText,
        "Номер счета юридического лица"
      );
    } else if (label === "Алиас счета юр. лица") {
      result["алиас_счета"] = extractAlias(
        inputText,
        "Алиас счета юридического лица (синоним счета)"
      );
    } else if (label === "Идентификатор ТСП") {
      result["идентификатор_тсп"] = extractBetweenLabels(
        inputText,
        "Идентификатор ТСП",
        "ID платформы"
      );
    } else if (label === "ID платформы") {
      result["id_платформы"] = extractAfterLabel(inputText, "ID платформы");
    } else if (label === "Адрес") {
      result["город_адрес"] = extractCityAndAddress(inputText, inputText);
    }
  }

  displayResults(result, outputDiv);

  const faultDescription = extractBetweenLabels(
    inputText,
    "Описание неисправности",
    "Наименование клиента"
  );
  faultDescriptionElement.innerHTML = faultDescription
    ? highlightKeywords(faultDescription)
    : "Не указано";

  const secondEntityStart = inputText.indexOf("2 юр.лицо:");
  if (secondEntityStart !== -1) {
    const secondEntityText = inputText.substring(secondEntityStart);
    const secondEntityData = extractSecondEntityData(secondEntityText);
    if (secondEntityData) {
      const secondEntityHeader = document.createElement("h3");
      secondEntityHeader.textContent = "2 юр.лицо";
      outputDiv.appendChild(secondEntityHeader);
      displaySecondEntityResults(secondEntityData, outputDiv);
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
    { label: "", value: data["первая_строка"], type: "text" },
    { label: "Тип терминала", value: data["тип_терминала"], type: "text" },
    {
      label: "ТСП",
      value: data["название_тсп"]?.split(",")[0].trim(),
      type: "button",
    },
    { label: "MID", value: data["merchant_id"], type: "button" },
    { label: "ID платформы", value: data["id_платформы"], type: "button" },
    { label: "TID", value: data["terminal_id"], type: "button" },
    {
      label: "Идентификатор ТСП",
      value: data["идентификатор_тсп"],
      type: "button",
    },
    {
      label: "Номер счета юр. лица",
      value: data["номер_счета"],
      type: "button",
    },
    {
      label: "Алиас счета юр. лица",
      value: data["алиас_счета"],
      type: "button",
    },
    { label: "Адрес", value: data["город_адрес"], type: "button" },
  ];

  fields.forEach((field) => {
    // Пропускаем любые пустые значения
    if (!field.value) return;

    const itemDiv = document.createElement("div");
    itemDiv.className = "result-item";

    if (field.label) {
      const labelSpan = document.createElement("span");
      labelSpan.textContent = `${field.label}:`;
      itemDiv.appendChild(labelSpan);
    }

    if (field.type === "button") {
      const button = document.createElement("button");
      button.innerHTML = field.value;
      button.onclick = () => copyToClipboard(button);
      itemDiv.appendChild(button);
    } else {
      const textElement = document.createElement("span");
      textElement.innerHTML = field.value;
      itemDiv.appendChild(textElement);
    }

    outputDiv.appendChild(itemDiv);
  });
}

function displaySecondEntityResults(data, outputDiv) {
  const fields = [
    {
      label: "ТСП",
      value: data["название_тсп"]?.split(",")[0].trim(),
      type: "button",
    },
    { label: "MID", value: data["merchant_id"], type: "button" },
    { label: "TID", value: data["terminal_id"], type: "button" },
    { label: "TPK_KEY", value: data["tpk_key"], type: "button" },
    { label: "TAK_KEY", value: data["tak_key"], type: "button" },
    { label: "TDK_KEY", value: data["tdk_key"], type: "button" },
  ];
  fields.forEach((field) => {
    if (field.value === null || field.value === "Не указано") return;
    const itemDiv = document.createElement("div");
    itemDiv.className = "result-item";
    if (field.label) {
      const labelSpan = document.createElement("span");
      labelSpan.textContent = `${field.label}:`;
      itemDiv.appendChild(labelSpan);
    }
    if (field.type === "button") {
      const button = document.createElement("button");
      button.innerHTML = field.value;
      button.onclick = () => copyToClipboard(button);
      itemDiv.appendChild(button);
    } else {
      const textElement = document.createElement("span");
      textElement.innerHTML = field.value;
      itemDiv.appendChild(textElement);
    }
    outputDiv.appendChild(itemDiv);
  });
}

function extractSecondEntityData(text) {
  const secondEntityPatterns = {
    terminal_id: /Terminal_ID\s*:\s*(\d+)/i,
    merchant_id: /MerchantID\s*:\s*(\S+)/i,
    tpk_key: /TPK_KEY\s*:\s*(\S+)/i,
    tak_key: /TAK_KEY\s*:\s*(\S+)/i,
    tdk_key: /TDK_KEY\s*:\s*(\S+)/i,
    название_тсп: /Название\s+ТСП:\s*(.*?),/i,
  };
  const data = {};
  for (const [key, pattern] of Object.entries(secondEntityPatterns)) {
    const match = text.match(pattern);
    data[key] = match && match[1] ? match[1].trim() : null;
  }
  return data;
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
  ];
  keywords.forEach((keyword) => {
    const regex = new RegExp(`(${keyword})`, "gi");
    text = text.replace(regex, '<span class="attention">$1</span>');
  });
  return text;
}

// Загрузка темы при загрузке страницы
loadTheme();
