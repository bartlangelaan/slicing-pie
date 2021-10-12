import styled from 'styled-components';

const Spinner = styled.div`
  border-color: #3790c3;
`;

export function Loader() {
  return (
    <div className="flex justify-center items-center">
      <Spinner className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4" />
    </div>
  );
}
