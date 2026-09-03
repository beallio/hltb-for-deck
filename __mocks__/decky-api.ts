// @decky/api ships ESM and expects the Decky runtime, so unit tests stub it.
// Only the pure helpers of the HLTB client are exercised here; any test that
// reaches the network layer should fail loudly instead of silently passing.
export const fetchNoCors = () => {
    throw new Error('fetchNoCors is not available in unit tests');
};
