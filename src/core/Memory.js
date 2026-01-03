export class Memory {
    constructor() {
        this.conversation = [];
    }

    add(role, content, metadata = {}) {
        this.conversation.push({
            role,
            content,
            metadata,
            timestamp: Date.now()
        });
    }

    getHistory() {
        return [...this.conversation];
    }
}

export const globalMemory = new Memory();