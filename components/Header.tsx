import styled, { css } from 'styled-components';
import { useSlicingPie } from './SlicingPieContext';

const StyledHeader = styled.header<{
  isRefreshingData: boolean;
  hiddenModeEnabled: boolean;
  cantRetry: boolean;
}>`
  background-color: #3790c3;

  ${(p) =>
    (p.isRefreshingData || p.hiddenModeEnabled) &&
    css`
      background-color: #c38437;
    `};

  ${(p) =>
    p.cantRetry &&
    css`
      background-color: #c33737;
    `};

  transition: ease-in-out 0.2s;
`;

const FilterItemButton = styled.button<{ active: boolean; disabled?: boolean }>`
  transition: all 0.2s ease-in-out;
  background-color: rgba(255, 255, 255, 0.6);
  color: #3790c3;
  padding: 4px;
  border-radius: 2px;

  ${(p) =>
    p.active &&
    css`
      background-color: white;
      color: #3790c3;
    `}

  ${(p) =>
    p.disabled &&
    css`
      cursor: default;
      background-color: white;
      color: #3790c3;
      opacity: 0.5;
    `}
`;

export function Header() {
  const slicingPie = useSlicingPie();

  return (
    <StyledHeader
      className="text-white p-6 flex sticky top-0 z-20"
      isRefreshingData={slicingPie.isRefreshingSlicingPie}
      hiddenModeEnabled={slicingPie.hiddenModeEnabled}
      cantRetry={!slicingPie.canRetry}
    >
      <h1 className="text-xl flex items-center content-center">
        <img
          src="/logo-popup-io-cropped-white.png"
          alt="Logo Popup IO"
          width={120}
        />
        <span className="ml-4 -mt-2">-</span>
        <span className="ml-4 -mt-2">Slicing pie</span>
      </h1>
      <ul className="flex items-center content-center flex-1 ml-4 -mt-2">
        <li>
          <FilterItemButton
            active={slicingPie.periodFilter === 2021}
            disabled={!slicingPie.canRetry}
            onClick={() => {
              slicingPie.setPeriodFilter(2021);
            }}
          >
            2021
          </FilterItemButton>
        </li>
        <li className="ml-2">
          <FilterItemButton
            active={slicingPie.periodFilter === 2022}
            disabled={!slicingPie.canRetry}
            onClick={() => {
              slicingPie.setPeriodFilter(2022);
            }}
          >
            2022
          </FilterItemButton>
        </li>
      </ul>
      {/* <button
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
      </button> */}
      <button
        className=""
        type="button"
        disabled={!slicingPie.canRetry}
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
