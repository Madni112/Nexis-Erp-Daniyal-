import useColorMode from '../../hooks/useColorMode';

const DarkModeSwitcher = () => {
  const [colorMode, setColorMode] = useColorMode();

  return (
    <label
      className={`relative m-0 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
        colorMode === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
      }`}
      title="Toggle Dark / Light Theme"
    >
      <input
        type="checkbox"
        checked={colorMode === 'dark'}
        onChange={() => {
          if (typeof setColorMode === 'function') {
            setColorMode(colorMode === 'light' ? 'dark' : 'light');
          }
        }}
        className="sr-only"
      />
      <span
        className={`pointer-events-none flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
          colorMode === 'dark' ? 'translate-x-5 text-slate-800' : 'translate-x-0 text-amber-500'
        }`}
      >
        {colorMode === 'dark' ? (
          <svg className="h-3 w-3 fill-slate-700" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg className="h-3 w-3 fill-amber-500" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
    </label>
  );
};

export default DarkModeSwitcher;
