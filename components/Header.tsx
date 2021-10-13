import styled from 'styled-components';
import { useSlicingPie } from './SlicingPieContext';

const StyledHeader = styled.header<{
  isRefreshingData: boolean;
  hiddenModeEnabled: boolean;
}>`
  background-color: ${(p) =>
    p.isRefreshingData || p.hiddenModeEnabled ? '#c38437' : '#3790c3'};
  transition: ease-in-out 0.2s;
`;

export function Header() {
  const slicingPie = useSlicingPie();

  return (
    <StyledHeader
      className="text-white p-6 flex sticky top-0 z-20"
      isRefreshingData={slicingPie.isRefreshingSlicingPie}
      hiddenModeEnabled={slicingPie.hiddenModeEnabled}
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
        className="mr-4"
        type="button"
        onClick={() => {
          slicingPie.setHiddenModeEnabled(
            (currentHiddenModeEnabled) => !currentHiddenModeEnabled,
          );
        }}
      >
        <span
          title={
            slicingPie.hiddenModeEnabled
              ? 'Disable Hidden mode'
              : 'Enable Hidden mode'
          }
          className="material-icons material-icons-outlined transition-transform transform hover:scale-110"
        >
          {`visibility${slicingPie.hiddenModeEnabled ? '_off' : ''}`}
        </span>
      </button>
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
              : ' transition-transform transform hover:rotate-90 hover:scale-110'
          }`}
        >
          autorenew
        </span>
      </button>
    </StyledHeader>
  );
}
