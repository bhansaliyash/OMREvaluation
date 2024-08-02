
function Header() {
  return (
    <nav className="bg-[#D8F1A0]">
        <div className="mx-auto max-w-7xl px-2">
            <div className="relative flex items-center justify-between">
                <div className="flex flex-shrink-0 items-center">
                    <img className="h-32 w-auto" src={`${process.env.PUBLIC_URL}/MG_LOGO.png`} alt="Maker Ghat Logo"/>
                </div>
                <div className='text-2xl font-semibold'>
                    OMR Evaluation Tool
                </div>
            </div>
        </div>
    </nav>
  );
}

export default Header;