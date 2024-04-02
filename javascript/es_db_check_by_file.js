function processFiles() {
    const esFileInput = document.getElementById('esFile');
    const dbFileInput = document.getElementById('dbFile');

    if (esFileInput.files.length === 0 || dbFileInput.files.length === 0) {
        alert('両方のファイルを選択してください。');
        return;
    }

    const esFile = esFileInput.files[0];
    const dbFile = dbFileInput.files[0];

    readESData(esFile)
        .then(esDataArray => {
            readDBData(dbFile)
                .then(dbDataArray => {
                    const mergedData = mergeData(esDataArray, dbDataArray);
                    const filteredData = filterData(mergedData);
                    if (filteredData.length > 0) {
                        exportToCSV(filteredData);
                        alert("データの不整合が見つかりました。ダウンロードされたCSVファイルを確認してください。");
                    } else {
                      alert("データの不整合は見つかりませんでした。");
                    }
                });
        });
}

function readESData(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const esData = JSON.parse(e.target.result);
            const esDataArray = esData.hits.hits.map(hit => ({
                ...hit._source,
                entry_id: hit._source.entry_id.toString(),
                updated_at: hit._source.updated_at.toString()
            }));
            resolve(esDataArray);
        };
        reader.readAsText(file);
    });
}

function readDBData(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dbData = e.target.result;
            const dbDataArray = dbData.split('\n').slice(1).map(row => {
                const values = row.trim().split(',');
                return values.length > 1 ? { entry_id: values[0].toString(), updated_at: values[1].trim() } : null;
            }).filter(item => item !== null);
            resolve(dbDataArray);
        };
        reader.readAsText(file);
    });
}

function mergeData(esDataArray, dbDataArray) {
    return esDataArray.map(esItem => {
        const dbItem = dbDataArray.find(dbItem => dbItem.entry_id === esItem.entry_id);
        if (dbItem) {
            return { ...esItem, updated_at_from_db: dbItem.updated_at };
        }
        return { ...esItem, updated_at_from_db: undefined };
    });
}

function filterData(mergedData) {
    return mergedData.filter(item => item.updated_at !== item.updated_at_from_db);
}

function exportToCSV(dataArray) {
    const csvHeader = "entry_id,updated_at_from_es,updated_at_from_db\n";
    const csvBody = dataArray.map(item => `${item.entry_id},${item.updated_at},${item.updated_at_from_db}`).join("\n");
    const csvContent = csvHeader + csvBody;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "mismatched_updates.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}