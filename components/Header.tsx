import styled from 'styled-components';
import { useSlicingPie } from './SlicingPieContext';

const StyledHeader = styled.header<{ isRefreshingData: boolean }>`
  background-color: ${(p) => (p.isRefreshingData ? '#c38437' : '#3790c3')};
  transition: ease-in-out 0.2s;
`;

export function Header() {
  const slicingPie = useSlicingPie();

  return (
    <StyledHeader
      className="text-white p-6 flex sticky top-0 z-10"
      isRefreshingData={slicingPie.isRefreshingSlicingPie}
    >
      <h1 className="text-xl flex items-center content-center flex-1">
        <img
          src="/logo-popup-io-cropped-white.png"
          alt="Logo Popup IO"
          width={120}
        />
        <span className="ml-4 -mt-2">-</span>
        <span className="ml-4 -mt-2">Slicing pie</span>
      </h1>
      <button
        className=""
        type="button"
        onClick={() => {
          slicingPie.fetchData();
        }}
      >
        <span
          title={
            slicingPie.isRefreshingSlicingPie
              ? 'Refreshing data...'
              : 'Up-to-date'
          }
          className={`material-icons material-icons-outlined${
            slicingPie.isRefreshingSlicingPie
              ? ' animate-spin'
              : ' transition-transform transform hover:rotate-90'
          }`}
        >
          autorenew
        </span>
      </button>
    </StyledHeader>
  );
}
