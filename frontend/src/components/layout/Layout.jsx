import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {

  return (
    <div className="min-h-screen bg-yellow-50 text-white">
      <Header/> 
      <div className="flex-1 transition-all duration-200 ease-in-out ">
        <main className="pt-16 min-h-[calc(100vh-4rem)] ">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;