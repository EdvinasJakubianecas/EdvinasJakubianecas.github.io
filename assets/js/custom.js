/*--------------------------------------------------------------
# custom.js - 11 laboratorinis darbas
# Kontaktų formos apdorojimas, validacija ir telefono formatavimas
--------------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const form = document.getElementById("contact-form");
  if (!form) return;

  const submitBtn = document.getElementById("submit-btn");
  const clearBtn = document.getElementById("clear-btn");
  const output = document.getElementById("form-output");

  /* ---------- Validacijos taisyklės ---------- */
  const NAME_RE = /^\p{L}+$/u;                       // tik raidės
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;  // vardas@domenas.lt
  const PHONE_RE = /^\+370 6\d{2} \d{5}$/;           // +370 6xx xxxxx

  const REQUIRED_MSG = "Šis laukas privalomas.";

  function validateName(value) {
    if (value.trim() === "") return REQUIRED_MSG;
    if (!NAME_RE.test(value.trim())) return "Leidžiamos tik raidės.";
    return "";
  }

  function validateRating(input) {
    if (input.validity.badInput) return "Įveskite sveikąjį skaičių nuo 1 iki 10.";
    const value = input.value.trim();
    if (value === "") return REQUIRED_MSG;
    if (!/^\d+$/.test(value)) return "Įveskite sveikąjį skaičių nuo 1 iki 10.";
    const n = Number(value);
    if (n < 1 || n > 10) return "Reikšmė turi būti nuo 1 iki 10.";
    return "";
  }

  // kiekvienas laukas turi savo tikrinimo funkciją (grąžina klaidos tekstą arba "")
  const fields = {
    vardas:      { el: form.elements.vardas,      check: (el) => validateName(el.value) },
    pavarde:     { el: form.elements.pavarde,     check: (el) => validateName(el.value) },
    email: {
      el: form.elements.email,
      check: (el) => {
        const v = el.value.trim();
        if (v === "") return REQUIRED_MSG;
        if (!EMAIL_RE.test(v)) return "Neteisingas el. pašto formatas (pvz., vardas@pastas.lt).";
        return "";
      }
    },
    telefonas: {
      el: form.elements.telefonas,
      check: (el) => {
        if (el.value === "") return REQUIRED_MSG;
        if (!PHONE_RE.test(el.value)) return "Numeris turi būti formatu +370 6xx xxxxx.";
        return "";
      }
    },
    adresas: {
      el: form.elements.adresas,
      check: (el) => {
        const v = el.value.trim();
        if (v === "") return REQUIRED_MSG;
        if (v.length < 5) return "Adresas per trumpas.";
        return "";
      }
    },
    klausimas1: { el: form.elements.klausimas1, check: validateRating },
    klausimas2: { el: form.elements.klausimas2, check: validateRating },
    klausimas3: { el: form.elements.klausimas3, check: validateRating }
  };

  // laukai, su kuriais vartotojas jau sąveikavo (klaidos rodomos tik jiems)
  const touched = new Set();

  /* ---------- Klaidų rodymas realiu laiku ---------- */
  function renderField(name) {
    const { el, check } = fields[name];
    const errorBox = document.getElementById(name + "-error");
    const message = check(el);

    el.classList.remove("is-invalid", "is-valid");
    errorBox.textContent = "";
    el.removeAttribute("aria-invalid");

    if (!touched.has(name)) return;

    if (message) {
      el.classList.add("is-invalid");
      el.setAttribute("aria-invalid", "true");
      errorBox.textContent = message;
    } else {
      el.classList.add("is-valid");
    }
  }

  /* ---------- Mygtuko „Siųsti“ būsena ---------- */
  function isFormValid() {
    return Object.keys(fields).every((name) => fields[name].check(fields[name].el) === "");
  }

  function updateSubmitState() {
    submitBtn.disabled = !isFormValid();
  }

  /* ---------- Telefono numerio formatavimas ---------- */
  function formatPhone(raw) {
    let digits = raw.replace(/\D/g, "");               // tik skaitmenys
    if (digits.startsWith("370")) {
      digits = digits.slice(3);                        // pašaliname jau pridėtą kodą
    } else if (digits.length <= 2 && "370".startsWith(digits)) {
      digits = "";                                     // ištrinant kodo dalį
    }
    digits = digits.replace(/^[^6]+/, "");             // lietuviški mobilieji prasideda 6
    digits = digits.slice(0, 8);                       // ilgis: 6xx xxxxx = 8 skaitmenys
    if (digits === "") return "";
    let result = "+370 " + digits.slice(0, 3);
    if (digits.length > 3) result += " " + digits.slice(3);
    return result;
  }

  fields.telefonas.el.addEventListener("input", function () {
    this.value = formatPhone(this.value);
  });

  /* ---------- Įvykiai: input / blur ---------- */
  Object.keys(fields).forEach(function (name) {
    const el = fields[name].el;
    el.addEventListener("input", function () {
      touched.add(name);
      renderField(name);
      updateSubmitState();
    });
    el.addEventListener("blur", function () {
      touched.add(name);
      renderField(name);
    });
  });

  /* ---------- Formos pateikimas ---------- */
  form.addEventListener("submit", function (event) {
    event.preventDefault();                            // puslapis neperkraunamas

    if (!isFormValid()) {                              // apsauga, jei mygtukas apeitas
      Object.keys(fields).forEach((name) => { touched.add(name); renderField(name); });
      updateSubmitState();
      return;
    }

    // visos laukų vertės surenkamos į objektą
    const formData = {
      vardas: fields.vardas.el.value.trim(),
      pavarde: fields.pavarde.el.value.trim(),
      elPastas: fields.email.el.value.trim(),
      telefonas: fields.telefonas.el.value,
      adresas: fields.adresas.el.value.trim(),
      klausimas1: Number(fields.klausimas1.el.value),
      klausimas2: Number(fields.klausimas2.el.value),
      klausimas3: Number(fields.klausimas3.el.value)
    };

    // trijų įvertinimų vidurkis
    const average = (formData.klausimas1 + formData.klausimas2 + formData.klausimas3) / 3;
    formData.vidurkis = Number(average.toFixed(2));

    console.log(formData);                             // objektas konsolėje

    showOutput(formData);
  });

  /* ---------- Rezultato atvaizdavimas po forma ---------- */
  function addLine(parent, label, value, extraClass) {
    const p = document.createElement("p");
    if (extraClass) p.className = extraClass;
    p.textContent = label + ": " + value;              // textContent apsaugo nuo HTML įterpimo
    parent.appendChild(p);
  }

  function showOutput(data) {
    output.replaceChildren();

    const title = document.createElement("h4");
    title.textContent = "Pateikti duomenys";
    output.appendChild(title);

    addLine(output, "Vardas", data.vardas);
    addLine(output, "Pavardė", data.pavarde);
    addLine(output, "El. paštas", data.elPastas);
    addLine(output, "Tel. numeris", data.telefonas);
    addLine(output, "Adresas", data.adresas);
    addLine(output, "1 klausimas", data.klausimas1);
    addLine(output, "2 klausimas", data.klausimas2);
    addLine(output, "3 klausimas", data.klausimas3);
    addLine(output, data.vardas + " " + data.pavarde, data.vidurkis.toFixed(2), "form-output-average");

    output.hidden = false;
  }

  /* ---------- „Išvalyti“ ---------- */
  clearBtn.addEventListener("click", function () {
    form.reset();                                      // išvalo laukus
    touched.clear();
    Object.keys(fields).forEach(renderField);          // pašalina klaidas ir spalvas
    output.replaceChildren();                          // pašalina rezultatą ir vidurkį
    output.hidden = true;
    updateSubmitState();                               // „Siųsti“ vėl neaktyvus
    fields.vardas.el.focus();
  });

  updateSubmitState();                                 // pradžioje „Siųsti“ neaktyvus
});
