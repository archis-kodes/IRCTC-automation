(() => {
  "use strict";

  const els = {
    id: document.getElementById("id"),
    password: document.getElementById("password"),
    togglePassword: document.getElementById("togglePassword"),
    source: document.getElementById("source"),
    destination: document.getElementById("destination"),
    swapStations: document.getElementById("swapStations"),
    date: document.getElementById("date"),
    trainNumber: document.getElementById("trainNumber"),
    totalCoachTypes: document.getElementById("total_coach_types"),
    coachType: document.getElementById("coach_type"),
    coachNote: document.getElementById("coachNote"),
    paxList: document.getElementById("paxList"),
    railTrack: document.getElementById("railTrack"),
    railFill: document.getElementById("railFill"),
    railTrain: document.getElementById("railTrain"),
    railStations: document.getElementById("railStations"),
    downloadBotBtn: document.getElementById("downloadBotBtn"),
    departureSignal: document.getElementById("departureSignal"),
    departureStatus: document.getElementById("departureStatus"),
    departureFilename: document.getElementById("departureFilename"),
    downloadBtn: document.getElementById("downloadBtn"),
    liveRegion: document.getElementById("liveRegion"),
    form: document.getElementById("journeyForm"),
  };

  const SECTION_ORDER = ["login", "route", "schedule", "class", "passengers"];

  /* ----------------------------------------------------------
     Small input hygiene helpers
     ---------------------------------------------------------- */
  function attachUppercaseStation(input) {
    input.addEventListener("input", () => {
      const cleaned = input.value.toUpperCase().replace(/[^A-Z]/g, "");
      if (input.value !== cleaned) input.value = cleaned;
      validateAll();
    });
  }

  attachUppercaseStation(els.source);
  attachUppercaseStation(els.destination);

  els.trainNumber.addEventListener("input", () => {
    const cleaned = els.trainNumber.value.replace(/[^0-9]/g, "").slice(0, 5);
    if (els.trainNumber.value !== cleaned) els.trainNumber.value = cleaned;
    validateAll();
  });

  ["id", "password", "date"].forEach((key) => {
    els[key].addEventListener("input", validateAll);
    els[key].addEventListener("change", validateAll);
  });

  [els.totalCoachTypes, els.coachType].forEach((input) => {
    input.addEventListener("input", () => {
      const cleaned = input.value.replace(/[^0-9]/g, "").slice(0, 2);
      if (input.value !== cleaned) input.value = cleaned;
      validateAll();
    });
  });

  els.togglePassword.addEventListener("click", () => {
    const isHidden = els.password.type === "password";
    els.password.type = isHidden ? "text" : "password";
    els.togglePassword.textContent = isHidden ? "🙈" : "👁";
    els.togglePassword.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });

  els.swapStations.addEventListener("click", () => {
    const s = els.source.value;
    els.source.value = els.destination.value;
    els.destination.value = s;
    validateAll();
  });

  /* ----------------------------------------------------------
     Passenger drag-to-reorder
     ---------------------------------------------------------- */
  let dragEl = null;

  function refreshPaxPositions() {
    [...els.paxList.children].forEach((chip, i) => {
      chip.querySelector(".pax-chip__pos").textContent = String(i + 1);
    });
  }

  [...els.paxList.children].forEach((chip) => {
    chip.addEventListener("dragstart", () => {
      dragEl = chip;
      chip.classList.add("is-dragging");
    });
    chip.addEventListener("dragend", () => {
      chip.classList.remove("is-dragging");
      dragEl = null;
      refreshPaxPositions();
      validateAll();
    });
    chip.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!dragEl || dragEl === chip) return;
      const rect = chip.getBoundingClientRect();
      const before = e.clientX < rect.left + rect.width / 2;
      els.paxList.insertBefore(dragEl, before ? chip : chip.nextSibling);
    });
  });

  /* ----------------------------------------------------------
     Validation
     ---------------------------------------------------------- */
  function markField(input, valid) {
    input.classList.toggle("is-valid", valid);
    input.classList.toggle("is-invalid", !valid && input.value.length > 0);
  }

  function sectionValidity() {
    const idValid = els.id.value.trim().length > 0;
    const passValid = els.password.value.length > 0;

    const sourceValid = /^[A-Z]{2,5}$/.test(els.source.value);
    const destValid = /^[A-Z]{2,5}$/.test(els.destination.value) && els.destination.value !== els.source.value;

    const dateValid = els.date.value.length > 0;
    const trainValid = /^\d{4,5}$/.test(els.trainNumber.value);

    const total = parseInt(els.totalCoachTypes.value, 10);
    const chosen = parseInt(els.coachType.value, 10);
    const totalValid = Number.isInteger(total) && total >= 1;
    const chosenValid = Number.isInteger(chosen) && chosen >= 1;
    const classValid = totalValid && chosenValid && chosen <= total;

    const paxValid = els.paxList.children.length === 6;

    markField(els.id, idValid);
    markField(els.password, passValid);
    markField(els.source, sourceValid);
    markField(els.destination, destValid);
    markField(els.date, dateValid);
    markField(els.trainNumber, trainValid);
    markField(els.totalCoachTypes, totalValid);
    markField(els.coachType, classValid);

    if (!totalValid || !chosenValid) {
      els.coachNote.textContent = "";
      els.coachNote.classList.remove("is-invalid");
    } else if (chosen > total) {
      els.coachNote.textContent = `Coach type ${chosen} doesn't exist — only ${total} type${total === 1 ? "" : "s"} on this train.`;
      els.coachNote.classList.add("is-invalid");
    } else {
      els.coachNote.textContent = `Booking coach type ${chosen} of ${total}.`;
      els.coachNote.classList.remove("is-invalid");
    }

    return {
      login: idValid && passValid,
      route: sourceValid && destValid,
      schedule: dateValid && trainValid,
      class: classValid,
      passengers: paxValid,
    };
  }

  /* ----------------------------------------------------------
     Train placement — locomotive front is aligned with each
     checkpoint dot using the same coordinate math, so the train
     and the stations can never drift out of sync
     ---------------------------------------------------------- */
  let lastFraction = 0;
  const stationEls = [...els.railStations.children];

  function layoutRail() {
    const trackWidth = els.railTrack.clientWidth;
    const trainWidth = els.railTrain.offsetWidth;
    const maxLeft = Math.max(trackWidth - trainWidth, 0);

    stationEls.forEach((li, i) => {
      const checkpointPx = trainWidth + (maxLeft * i) / (stationEls.length - 1);
      li.style.left = `${checkpointPx}px`;
    });

    return { trainWidth, maxLeft };
  }

  function positionTrain(fraction) {
    lastFraction = fraction;
    requestAnimationFrame(() => {
      const { trainWidth, maxLeft } = layoutRail();
      const trainLeft = fraction * maxLeft;
      els.railTrain.style.left = `${trainLeft}px`;
      els.railFill.style.width = `${trainWidth + trainLeft}px`;
    });
  }

  window.addEventListener("resize", () => positionTrain(lastFraction));

  function validateAll() {
    const validity = sectionValidity();
    let completeCount = 0;
    let firstIncompleteIndex = -1;

    SECTION_ORDER.forEach((key, i) => {
      const ticket = document.getElementById(`section-${key}`);
      const stationEl = els.railStations.querySelector(`[data-station="${key}"]`);
      const stampEl = document.querySelector(`[data-stamp="${key}"]`);
      const isComplete = validity[key];

      ticket.classList.toggle("is-complete", isComplete);
      stampEl.textContent = isComplete ? "✓" : "●";
      stationEl.classList.toggle("is-complete", isComplete);

      if (isComplete) {
        completeCount++;
      } else if (firstIncompleteIndex === -1) {
        firstIncompleteIndex = i;
      }
    });

    SECTION_ORDER.forEach((key, i) => {
      const stationEl = els.railStations.querySelector(`[data-station="${key}"]`);
      stationEl.classList.toggle("is-active", i === firstIncompleteIndex);
    });

    const fraction = completeCount === 0 ? 0 : (completeCount - 1) / (SECTION_ORDER.length - 1);
    positionTrain(fraction);

    const allComplete = completeCount === SECTION_ORDER.length;
    updateDeparture(allComplete, completeCount);
    return allComplete;
  }

  function updateDeparture(allComplete, completeCount) {
    els.departureSignal.classList.toggle("is-clear", allComplete);
    els.downloadBtn.disabled = !allComplete;
    els.downloadBtn.querySelector(".departure__btn-icon").textContent = allComplete ? "⬇" : "🔒";
    els.downloadBtn.querySelector(".departure__btn-text").textContent = allComplete
      ? "Download ticket.json"
      : "Download ticket.json";

    if (allComplete) {
      els.departureStatus.textContent = "Signal green — every stop checked in. Ready to download.";
      const trainNo = els.trainNumber.value || "XXXXX";
      els.departureFilename.textContent = `irctc_${trainNo}_journey.json`;
    } else {
      els.departureStatus.textContent = `Signal red — ${completeCount}/${SECTION_ORDER.length} stops checked in.`;
      els.departureFilename.textContent = "";
    }
  }

  /* ----------------------------------------------------------
     Build payload + download
     ---------------------------------------------------------- */
  function toDDMMYYYY(isoDate) {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  }

  function buildPayload() {
    return {
      id: els.id.value.trim(),
      password: els.password.value,
      source: els.source.value,
      destination: els.destination.value,
      date: toDDMMYYYY(els.date.value),
      trainNumber: els.trainNumber.value,
      coach_type: parseInt(els.coachType.value, 10),
      total_coach_types: parseInt(els.totalCoachTypes.value, 10),
      passenger_order: [...els.paxList.children].map((chip) => parseInt(chip.dataset.value, 10)),
    };
  }

  els.downloadBtn.addEventListener("click", () => {
    if (els.downloadBtn.disabled) return;
    const payload = buildPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = els.departureFilename.textContent || "irctc_journey.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    els.liveRegion.textContent = "Ticket JSON downloaded.";
  });

  els.form.addEventListener("submit", (e) => e.preventDefault());

  /* ----------------------------------------------------------
     Download Bot — the button is a plain link to app.py, which
     ships alongside index.html/style.css/script.js. We just
     announce it for the live region.
     ---------------------------------------------------------- */
  els.downloadBotBtn.addEventListener("click", () => {
    els.liveRegion.textContent = "app.py downloaded.";
  });

  /* ----------------------------------------------------------
     Init
     ---------------------------------------------------------- */
  refreshPaxPositions();
  validateAll();
})();
