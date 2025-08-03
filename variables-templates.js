// variables-templates.js
const variableTemplates = {
  "Шаблон Q80": `SENDTERMINFO=YES
PINPADINIT_WAIT=30000
EXTCTLS=3
AGENTTERMID=YES
MIR_SELECTED=2
RESETREVERS_DIALOG=YES
OW_DISABLE_PURCHASE_RETURN=1
CTLSLANGRU=1251
BANK=PSB
RKL=1`,

  "Шаблон Q25": `SENDTERMINFO=YES
MIR_SELECTED=2
AGENTTERMID=YES
OW_DISABLE_PURCHASE_RETURN=1
VOLUME_SIGNAL=80
RESETREVERS_DIALOG=YES
CTLS_ATTEMPTS=3
BANK=PSB
RKL=1`,

  "Шаблон D230": `SENDTERMINFO=YES
AGENTTERMID=YES
MIR_SELECTED=2
RESETREVERS_DIALOG=YES
OW_DISABLE_PURCHASE_RETURN=1
VOLUME_SIGNAL=80
BATTERY_MEASURE_MODE=1
BATTERY_WORKING_MODE=0
BATTERY_LEVEL_COLOR=15,70
CTLS_ATTEMPTS=3
BANK=PSB
RKL=1`,

  "Шаблон D230 S200": `SENDTERMINFO=YES
AGENTTERMID=YES
MIR_SELECTED=2
RESETREVERS_DIALOG=YES
OW_DISABLE_PURCHASE_RETURN=1
VOLUME_SIGNAL=80
BATTERY_MEASURE_MODE=1
BATTERY_WORKING_MODE=0
BATTERY_LEVEL_COLOR=15,70
CTLS_ATTEMPTS=3
RKL=1
EXTCTLS=3
SECURELINK=1
BANK=PSB`
};

function copyTemplate(button) {
  const templateName = button.textContent;
  const template = variableTemplates[templateName];
  if (template) {
    navigator.clipboard.writeText(template).then(() => {
      button.classList.add("copied");
      setTimeout(() => button.classList.remove("copied"), 3000);
    }).catch(err => {
      console.error('Ошибка при копировании:', err);
    });
  }
}