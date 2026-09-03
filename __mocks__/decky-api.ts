// Tests run without Decky and must not make network requests.
export const fetchNoCors = () => {
    throw new Error('fetchNoCors is not available in unit tests');
};
