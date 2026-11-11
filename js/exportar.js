(() => {
  function escaparCelulaCSV(value) {
    let text = value === null || value === undefined ? "" : String(value);
    const isNumber = /^-?\d+(?:\.\d+)?$/.test(text);
    if (!isNumber && /^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function adicionarLinhasCSV(value, path, rows) {
    if (value === undefined) return;
    if (value === null || typeof value !== "object") {
      rows.push([path || "dados", value === null ? "" : String(value)]);
      return;
    }
    if (value instanceof Date) {
      rows.push([path || "dados", value.toISOString()]);
      return;
    }
    if (Array.isArray(value)) {
      if (!value.length) {
        rows.push([path || "dados", "[]"]);
        return;
      }
      value.forEach((item, index) => adicionarLinhasCSV(item, `${path}[${index}]`, rows));
      return;
    }

    const entries = Object.entries(value);
    if (!entries.length) {
      rows.push([path || "dados", "{}"]);
      return;
    }
    entries.forEach(([key, item]) => {
      adicionarLinhasCSV(item, path ? `${path}.${key}` : key, rows);
    });
  }

  function baixarArquivo(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportarDados(dados, nomeArquivo = "tatame-dados") {
    if (dados === null || typeof dados !== "object") {
      throw new TypeError("Informe um objeto ou uma lista de dados carregados.");
    }
    if (typeof nomeArquivo !== "string") {
      throw new TypeError("O nome do arquivo deve ser um texto.");
    }

    const prototype = Object.getPrototypeOf(dados);
    if (!Array.isArray(dados) && prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Os dados devem ser um objeto simples ou uma lista.");
    }

    const baseName = nomeArquivo
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
      .replace(/[. ]+$/g, "")
      .trim() || "tatame-dados";
    const json = JSON.stringify(dados, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value, 2);
    if (typeof json !== "string") {
      throw new TypeError("Não foi possível converter os dados para JSON.");
    }

    const rows = [["Campo", "Valor"]];
    adicionarLinhasCSV(dados, "", rows);
    const csv = `\uFEFF${rows.map((row) => row.map(escaparCelulaCSV).join(",")).join("\r\n")}`;
    baixarArquivo(`${baseName}.json`, json, "application/json;charset=utf-8");
    baixarArquivo(`${baseName}.csv`, csv, "text/csv;charset=utf-8");
  }

  window.exportarDados = exportarDados;
})();
