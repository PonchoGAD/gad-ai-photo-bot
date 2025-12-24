import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Table(props) {
    return (_jsxs("table", { children: [_jsx("thead", { children: _jsx("tr", { children: props.columns.map((c) => (_jsx("th", { children: c }, c))) }) }), _jsx("tbody", { children: props.data.map((row, i) => (_jsx("tr", { children: props.columns.map((c) => (_jsx("td", { children: row[c] }, c))) }, i))) })] }));
}
//# sourceMappingURL=Table.js.map