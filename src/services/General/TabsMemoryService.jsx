const rememberedTab = (title) => {
    if (!title || typeof window === 'undefined') {
        return null;
    }

    const stored = localStorage.getItem(`activeTab_${title}`);

    if (stored === null) {
        return null;
    }

    const saved = Number(stored);

    return Number.isInteger(saved) ? saved : null;
};

export {
    rememberedTab,
};
