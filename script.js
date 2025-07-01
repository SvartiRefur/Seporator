const patterns = {
  merchant_id: /MerchantID\s*:\s*(\S+)/i,
  тип_терминала: /Тип\s+терминала\s*:\s*(\S+)/i,
  terminal_id: /Terminal_ID\s*:\s*(\S+)/i,
  модель_терминала: /Модель\s+терминала\s*:\s*(.*)$/im,
  модель_пинпада: /Модель\s+пин-пада\s*:\s*(.*)$/im,
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
  SHCH: "Щ",
  YU: "Ю",
  YA: "Я",
  J: "ДЖ",
  W: "В",
  Q: "КВ",
  KY: "КИЙ",
  NYY: "НЫЙ",
  ANGELS: "ЭНГЕЛЬС",
  ROSLAVL: "РОСЛАВЛЬ",
  TVER: "ТВЕРЬ",
  STAVROPOL: "СТАВРОПОЛЬ",
  TSY: "ЦЫ",
  PERM: "ПЕРМЬ",
  NY: "НИЙ",
  GUS: "ГУСЬ",
  KHRUSTALNYY: "ХРУСТАЛЬНЫЙ",
  OKTYABRSKY: "ОКТЯБРЬСКИЙ",
  KAZAN: "КАЗАНЬ",
  ASTOSADOK: "ЭСТОСАДОК",
  PROKOPEVSK: "ПРОКОПЬЕВСК",
  DYATKOVO: "ДЯТЬКОВО",
  ULYANOVSK: "УЛЬЯНОВСК",
  UCHALY: "УЧАЛЫ",
  NOVOROSSYSK: "НОВОРОССИЙСК",
  VOLSK: "ВОЛЬСК",
  MYTISHCHI: "МЫТИЩИ",
  TYUMEN: "ТЮМЕНЬ",
  BRINKOVSKAYA: "БРИНЬКОВСКАЯ",
  NUGUSH: "НУГУШ",
  PROMYSHLENNAYA: "ПРОМЫШЛЕННАЯ",
  CHERNYSHEVKA: "ЧЕРНЫШЕВКА",
  IRKUTSK: "ИРКУТСК",
  YANYSHEVO: "ЯНЫШЕВО",
  GORNYY: "ГОРНЫЙ",
  BALYKLEY: "БАЛЫКЛЕЙ",
  RYBACHY: "РЫБАЧИЙ",
  BAKHTYBAEVO: "БАХТЫБАЕВО",
  STAROIZOBILNAYA: "СТАРОИЗОБИЛЬНАЯ",
  NEVINNOMYSSK: "НЕВИННОМЫССК",
  LEVOEGORLYKSKY: "ЛЕВОЕГОРЛЫКСКИЙ",
  SHUSHARY: "ШУШАРЫ",
  NOVOSADOVYY: "НОВОСАДОВЫЙ",
  SOL: "СОЛЬ",
  EGOREVSK: "ЕГОРЬЕВСК",
  KIMRY: "КИМРЫ",
  MEZHGORE: "МЕЖГОРЬЕ",
  POLYSAEVO: "ПОЛЫСАЕВО",
};
const KEYWORDS = [
  "МУЛЬТИМЕРЧАНТ",
  "ЭЛЕКТРОННЫМИ СЕРТИФИКАТАМИ",
  "ОБРАТНОГО ЭКВАЙРИНГА",
  "ОЭ",
  "ЭС",
  "Фармленд",
  "ФАРМЛЕНД",
  "KLK",
];

function transliterateToRussian(text) {
  if (!text) return '';
  text = text.toUpperCase();
  const keys = Object.keys(translitMap);
  const sortedKeys = keys.sort((a, b) => b.length - a.length);
  const pattern = new RegExp(sortedKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');
  return text.replace(pattern, match => translitMap[match.toUpperCase()] || match);
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

  const faultDescriptionElement = document.getElementById('faultDescription');
  if (!inputText.includes("Описание неисправности")) {
    faultDescriptionElement.innerHTML = "";
  }

  const requestTypeIndex = inputText.indexOf("Тип заявки");
  const textToProcess = requestTypeIndex !== -1 ? inputText.substring(0, requestTypeIndex) : inputText;

  const firstLine = textToProcess.split('\n')[0]?.trim() || '';
  result['первая_строка'] = firstLine;

  // Извлечение количества чеков
  const checkCountMatch = textToProcess.match(/\d+\s+(ЧЕК|ЧЕКА)/i);
  result['количество_чеков'] = checkCountMatch ? checkCountMatch[0] : null;

  // Извлечение часового пояса
  const timezoneMatch = textToProcess.match(/GMT[+-]?\d*/i);
  result['часовой_пояс'] = timezoneMatch ? timezoneMatch[0] : null;

  // Удаление количества чеков и часового пояса из первой строки
  let filteredFirstLine = firstLine;
  if (checkCountMatch && filteredFirstLine.includes(checkCountMatch[0])) {
    filteredFirstLine = filteredFirstLine.replace(checkCountMatch[0], '').trim();
  }
  if (timezoneMatch && filteredFirstLine.includes(timezoneMatch[0])) {
    filteredFirstLine = filteredFirstLine.replace(timezoneMatch[0], '').trim();
  }
  result['первая_строка'] = filteredFirstLine;

  // Извлечение ТСП
  const tspMatch = textToProcess.match(/Название\s+ТСП:\s*(.*?)(?=,|$)/i);
  let название_тсп = tspMatch ? tspMatch[1].trim() : null;
  if (название_тсп && название_тсп.includes(',')) {
    название_тсп = название_тсп.split(',')[0].trim();
  }
  result['название_тсп'] = название_тсп;

  // Извлечение SSID и Password из всего текста
  const ssidMatch = textToProcess.match(/SSID:\s*([^"\n]*)/i);
  const passwordMatch = textToProcess.match(/Password:\s*([^\s\n]+)/i);

  let ssid = ssidMatch ? ssidMatch[1].trim() : null;
  let password = passwordMatch ? passwordMatch[1].trim() : null;

  if (password && password.endsWith('"')) {
    password = password.slice(0, -1).trim();
  }

  result['ssid'] = ssid;
  result['password'] = password;

  // Удаление SSID и Password из первой строки
  if (ssidMatch && filteredFirstLine.includes(ssidMatch[0])) {
    filteredFirstLine = filteredFirstLine.replace(ssidMatch[0], '').trim();
  }
  if (passwordMatch && filteredFirstLine.includes(passwordMatch[0])) {
    filteredFirstLine = filteredFirstLine.replace(passwordMatch[0], '').trim();
  }
  result['первая_строка'] = filteredFirstLine;

  for (const [key, pattern] of Object.entries(patterns)) {
    if (key === 'название_тсп') continue;
    const match = textToProcess.match(pattern);
    result[key] = match ? match[1]?.trim() : null;
  }

  for (const [key, label] of Object.entries(specificFields)) {
    if (label === "Номер счета юр. лица") {
      result['номер_счета'] = extractNumberAfterLabel(textToProcess, "Номер счета юридического лица");
    } else if (label === "Алиас счета юр. лица") {
      result['алиас_счета'] = extractAlias(textToProcess, "Алиас счета юридического лица (синоним счета)");
    } else if (label === "Идентификатор ТСП") {
      result['идентификатор_тсп'] = extractBetweenLabels(textToProcess, "Идентификатор ТСП", "ID платформы");
    } else if (label === "ID платформы") {
      result['id_платформы'] = extractAfterLabel(textToProcess, "ID платформы");
    } else if (label === "Адрес") {
      result['город_адрес'] = extractCityAndAddress(textToProcess, inputText);
    }
  }

  displayResults(result, outputDiv);

  const faultDescription = extractKeywordsFromSection(inputText, "Описание неисправности", "Регистрационные данные");
  faultDescriptionElement.innerHTML = faultDescription
    ? highlightKeywords(faultDescription)
    : "Не указано";

  const secondEntityStart = inputText.indexOf("2 юр.лицо:");
  if (secondEntityStart !== -1) {
    const secondEntityText = inputText.substring(secondEntityStart);
    const secondEntityData = extractNthEntityData(secondEntityText);
    displayNthEntityResults(secondEntityData, outputDiv, 2);
  }

  const thirdEntityStart = inputText.indexOf("3 юр.лицо:");
  if (thirdEntityStart !== -1) {
    const thirdEntityText = inputText.substring(thirdEntityStart);
    const thirdEntityData = extractNthEntityData(thirdEntityText);
    displayNthEntityResults(thirdEntityData, outputDiv, 3);
  }

  const fourthEntityStart = inputText.indexOf("4 юр.лицо:");
  if (fourthEntityStart !== -1) {
    const fourthEntityText = inputText.substring(fourthEntityStart);
    const fourthEntityData = extractNthEntityData(fourthEntityText);
    displayNthEntityResults(fourthEntityData, outputDiv, 4);
  }

  highlightUsedLines(textToProcess, result);
}

function extractNumberAfterLabel(text, label) {
  const startIndex = text.indexOf(label);
  if (startIndex === -1) return null;
  const lineStart = text.slice(0, startIndex).lastIndexOf("\n") + 1;
  const lineEnd = text.indexOf("\n", startIndex) !== -1 ? text.indexOf("\n", startIndex) : text.length;
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
  while (aliasStart < text.length && text[aliasStart].trim() === "") aliasStart++;
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
  const lineEnd = text.indexOf("\n", startIndex) !== -1 ? text.indexOf("\n", startIndex) : text.length;
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
  const isCityFound = fullText.toLowerCase().includes(transliteratedCity.toLowerCase());
  const isAddressFound = fullText.toLowerCase().includes(transliteratedAddress.toLowerCase());
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

  if (data['password']) {
    fields.push(
      { label: "SSID", value: data['ssid'], type: "button" },
      { label: "Password", value: data['password'], type: "button" }
    );
  }

  fields.push(
    { label: "Количество чеков", value: data['количество_чеков'], type: "text" },
    { label: "Тип терминала", value: data['тип_терминала'], type: "text" },
    { label: "Модель терминала", value: data['модель_терминала'], type: "text" },
    { label: "Модель пин-пада", value: data['модель_пинпада'], type: "text" },
    { label: "ТСП", value: data['название_тсп']?.split(',')[0].trim(), type: "button" },
    { label: "MID", value: data['merchant_id'], type: "button" },
    { label: "ID платформы", value: data['id_платформы'], type: "button" },
    { label: "TID", value: data['terminal_id'], type: "button" },
    { label: "Идентификатор ТСП", value: data['идентификатор_тсп'], type: "button" },
    { label: "Номер счета юр. лица", value: data['номер_счета'], type: "button" },
    { label: "Алиас счета юр. лица", value: data['алиас_счета'], type: "button" },
    { label: "Адрес", value: data['город_адрес'], type: "button" },
    { label: "Часовой пояс", value: data['часовой_пояс'], type: "text" }
  );

  const firstLine = data['первая_строка'].toLowerCase();

  fields.forEach(field => {
    if (field.value === null || field.value === "Не указано") return;
    if ((field.label === "ТСП" && !data['название_тсп']) ||
        (field.label === "Адрес" && data['город_адрес'] === null)) return;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'result-item';

    if (field.label) {
      const labelSpan = document.createElement('span');
      labelSpan.textContent = `${field.label}:`;
      itemDiv.appendChild(labelSpan);
    }

    let displayValue;
    if (field.type === "button") {
      const button = document.createElement('button');
      button.innerHTML = field.value;
      button.onclick = () => copyToClipboard(button);
      displayValue = button;
    } else {
      displayValue = document.createElement('span');
      displayValue.innerHTML = field.value;

      if (field.label === "Модель терминала") {
        const fieldValue = field.value.toLowerCase();
        if (!firstLine.includes(fieldValue)) {
          displayValue.classList.add("attention");
        }
      }
    }

    itemDiv.appendChild(displayValue);
    outputDiv.appendChild(itemDiv);
  });
}

function extractNthEntityData(text) {
  const patterns = {
    название_тсп: /Название\s+ТСП:\s*(.*?),/i,
    merchant_id: /MerchantID\s*:\s*(\S+)/i,
    terminal_id: /Terminal_ID\s*:\s*(\S+)/i,
    tpk_key: /TPK_KEY\s*:\s*(\S+)/i,
    tak_key: /TAK_KEY\s*:\s*(\S+)/i,
    tdk_key: /TDK_KEY\s*:\s*(\S+)/i,
  };
  const data = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    data[key] = match ? match[1].trim() : null;
  }
  return data;
}

function displayNthEntityResults(data, outputDiv, number) {
  const fields = [
    { label: "ТСП", value: data["название_тсп"]?.split(",")[0].trim(), type: "button" },
    { label: "MID", value: data["merchant_id"], type: "button" },
    { label: "TID", value: data["terminal_id"], type: "button" },
    { label: "TPK_KEY", value: data["tpk_key"], type: "button" },
    { label: "TAK_KEY", value: data["tak_key"], type: "button" },
    { label: "TDK_KEY", value: data["tdk_key"], type: "button" },
  ];
  const hasData = fields.some(field => field.value);
  if (!hasData) return;

  const header = document.createElement("h3");
  header.textContent = `${number} юр.лицо`;
  outputDiv.appendChild(header);

  fields.forEach((field) => {
    if (field.value === null || field.value === "") return;
    const itemDiv = document.createElement("div");
    itemDiv.className = "result-item";
    const labelSpan = document.createElement("span");
    labelSpan.textContent = `${field.label}:`;
    itemDiv.appendChild(labelSpan);

    const button = document.createElement("button");
    button.innerHTML = field.value;
    button.onclick = () => copyToClipboard(button);
    itemDiv.appendChild(button);

    outputDiv.appendChild(itemDiv);
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
  if (!text) return "";
  KEYWORDS.forEach((keyword) => {
    const regex = new RegExp(`(${keyword})`, "gi");
    text = text.replace(regex, '<span class="attention">$1</span>');
  });
  return text;
}

function extractOnlyKeywords(text) {
  const foundKeywords = [];
  KEYWORDS.forEach((keyword) => {
    const regex = new RegExp(keyword, "gi");
    if (regex.test(text)) {
      foundKeywords.push(keyword);
    }
  });
  return foundKeywords.length > 0 ? foundKeywords.join(", ") : null;
}

function extractKeywordsFromSection(text, startLabel, endLabel) {
  const startIndex = text.indexOf(startLabel);
  const endIndex = text.indexOf(endLabel);
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const sectionText = text.substring(startIndex + startLabel.length, endIndex).trim();
    return extractKeywords(sectionText);
  }
  return null;
}

function extractKeywords(text) {
  const foundKeywords = [];
  KEYWORDS.forEach((keyword) => {
    const regex = new RegExp(keyword, "gi");
    if (regex.test(text)) {
      foundKeywords.push(keyword);
    }
  });
  return foundKeywords.length > 0 ? foundKeywords.join(", ") : null;
}

function highlightUsedLines(inputText, result) {
  const lines = inputText.split('\n');
  const usedLines = [];
  const allPatterns = [
    ...Object.values(patterns),
    ...Object.values(specificFields).map(label => new RegExp(label, 'i')),
    /SSID:/i,
    /Password:/i,
    /Название\s+ТСП:/i,
    /Город:/i,
    /Адрес установки:/i,
    /Описание неисправности/i,
    /Регистрационные данные/i,
    /2 юр\.лицо:/,
    /3 юр\.лицо:/,
    /4 юр\.лицо:/,
    /Номер счета юридического лица/i,
    /Модель\s+терминала\s*:/i,
    /Модель\s+пин-пада\s*:/i,
    /\d+\s+(ЧЕК|ЧЕКА)/i,
    /GMT[+-]?\d*/i
  ];
  for (const line of lines) {
    const isUsedLine = allPatterns.some(pattern => pattern.test(line));
    if (isUsedLine) {
      usedLines.push(`<span class="highlighted-line">${line}</span>`);
    } else {
      usedLines.push(line);
    }
  }
  document.getElementById('verificationText').innerHTML = usedLines.join('\n');
}

loadTheme();
