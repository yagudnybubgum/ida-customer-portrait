(function () {
  function parseCell(text) {
    var t = (text || "").replace(/\s+/g, " ").trim();
    if (!t || t === "—" || t === "-" || t === "–") {
      return { type: "empty", raw: "", num: null };
    }

    var money = t.match(/^\$?\s*([\d,.]+)\s*([KMB])?$/i);
    if (money) {
      var n = parseFloat(money[1].replace(/,/g, ""));
      var u = (money[2] || "").toUpperCase();
      if (u === "K") n *= 1e3;
      else if (u === "M") n *= 1e6;
      else if (u === "B") n *= 1e9;
      return { type: "num", raw: t, num: n };
    }

    var pct = t.match(/^([\d,.]+)\s*%$/);
    if (pct) {
      return { type: "num", raw: t, num: parseFloat(pct[1].replace(/,/g, "")) };
    }

    var plain = t.match(/^[\d,]+(\.\d+)?$/);
    if (plain) {
      return { type: "num", raw: t, num: parseFloat(t.replace(/,/g, "")) };
    }

    var res = t.match(/^(\d+)\s*[x×]\s*(\d+)$/i);
    if (res) {
      return { type: "num", raw: t, num: parseInt(res[1], 10) * parseInt(res[2], 10) };
    }

    return { type: "str", raw: t.toLowerCase(), num: null };
  }

  function cellValue(td) {
    return parseCell(td.textContent);
  }

  function compare(a, b, dir) {
    var emptyA = a.type === "empty";
    var emptyB = b.type === "empty";
    if (emptyA && emptyB) return 0;
    if (emptyA) return 1;
    if (emptyB) return -1;

    var bothNum = a.type === "num" && b.type === "num";
    var cmp;
    if (bothNum) cmp = a.num - b.num;
    else cmp = String(a.raw).localeCompare(String(b.raw), undefined, { numeric: true, sensitivity: "base" });

    return dir === "asc" ? cmp : -cmp;
  }

  function sortTable(table, colIndex, dir) {
    var tbody = table.tBodies[0];
    if (!tbody) return;
    var rows = Array.prototype.slice.call(tbody.rows);
    rows.sort(function (ra, rb) {
      return compare(cellValue(ra.cells[colIndex]), cellValue(rb.cells[colIndex]), dir);
    });
    rows.forEach(function (row) {
      tbody.appendChild(row);
    });
  }

  function initTable(table) {
    var thead = table.tHead;
    if (!thead || !thead.rows[0]) return;
    var ths = thead.rows[0].cells;

    Array.prototype.forEach.call(ths, function (th, i) {
      th.classList.add("sortable");
      th.setAttribute("role", "button");
      th.tabIndex = 0;
      if (!th.querySelector(".sort-ind")) {
        var ind = document.createElement("span");
        ind.className = "sort-ind";
        ind.setAttribute("aria-hidden", "true");
        th.appendChild(ind);
      }

      function activate() {
        var next = "asc";
        if (th.dataset.sort === "asc") next = "desc";
        else if (th.dataset.sort === "desc") next = "asc";

        Array.prototype.forEach.call(ths, function (other) {
          other.dataset.sort = "";
          other.removeAttribute("aria-sort");
        });
        th.dataset.sort = next;
        th.setAttribute("aria-sort", next === "asc" ? "ascending" : "descending");
        sortTable(table, i, next);
      }

      th.addEventListener("click", activate);
      th.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  document.querySelectorAll(".db table").forEach(initTable);
})();
