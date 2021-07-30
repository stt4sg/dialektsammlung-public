export namespace Rank {
  const defaultState = {
    myRank: -1,
  };

  export function reducer(state: any = defaultState, action: any) {
    switch (action.type) {
      case 'SET_RANK':
        return {
          ...state,
          myRank: action.rank,
        };
      case 'SET_NUMBER_OF_RANKS':
        return {
          ...state,
          numberOfRanks: action.numRank,
        };
      default:
        return state;
    }
  }
}
