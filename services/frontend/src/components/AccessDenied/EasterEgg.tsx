import irtomikko from '@/assets/irtomikko.png'

export const EasterEgg = () => {
  return (
    <>
      <img
        alt="Irtomikko"
        className="easter-egg"
        src={irtomikko}
        style={{
          position: 'absolute',
          right: '20px',
          bottom: '0',
        }}
        title="Irtomikko"
      />
      <style>
        {`
          @keyframes flyUp {
            0% {
              transform: translateY(0px);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateY(-200px);
              opacity: 0;
            }
          }

          .easter-egg {
            animation: flyUp 10s linear 1;
            animation-fill-mode: forwards;
          }
        `}
      </style>
    </>
  )
}
