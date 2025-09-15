export interface ParsedBlock {
    event: string;
    blocks: { label: string; content: string }[];
}

export function parseStream(raw: string): ParsedBlock[] {
    const chunks = raw.split(/(?=^event:)/m).map((c) => c.trim()).filter(Boolean);
    const results: ParsedBlock[] = [];

    for (const chunk of chunks) {
        const eventMatch = /^event:\s*(\w+)/i.exec(chunk);
        if (!eventMatch) continue;
        const event = eventMatch[1].toLowerCase();

        const dataText = chunk.split('\n')
            .map((l) => l.replace(/^data:\s*/i, '').trim())
            .join('\n') 
            .replace(/^event:\s*\w+\n/i, '') 
            .trim();

        const labels = ['Thought', 'Action', 'Results', 'Final Answer'];
        const blocks: { label: string; content: string }[] = [];
        let cursor = 0;

        while (cursor < dataText.length) {
            const nextLabel = labels
                .map((lbl) => ({ lbl, idx: dataText.toLowerCase().indexOf(lbl.toLowerCase() + ':', cursor) }))
                .filter(item => item.idx !== -1)
                .sort((a, b) => a.idx - b.idx)[0];

            if (!nextLabel) {
                const remainder = dataText.slice(cursor).trim();
                if (remainder) {
                    blocks.push({ label: 'Summary', content: remainder });
                }
                break;
            }

            const pretext = dataText.slice(cursor, nextLabel.idx).trim();
            if (pretext) {
                blocks.push({ label: 'Summary', content: pretext });
            }

            const contentStart = nextLabel.idx + nextLabel.lbl.length + 1;
            const nextLabelPos = labels
                .map((other) => dataText.toLowerCase().indexOf(other.toLowerCase() + ':', contentStart))
                .filter(pos => pos !== -1)
                .reduce((min, p) => Math.min(min, p), Infinity);

            const content = dataText.slice(contentStart, nextLabelPos).trim();
            blocks.push({ label: nextLabel.lbl, content });
            cursor = nextLabelPos;
        }

        if (blocks.length === 0 && dataText) {
            blocks.push({ label: 'Data', content: dataText });
        }

        if (blocks.length > 0) {
            results.push({ event, blocks });
        }
    }

    return results;
}