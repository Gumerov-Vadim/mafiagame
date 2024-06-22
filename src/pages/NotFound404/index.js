import Navbar from "../../components/Navbar";

export default function NotFound404(){
    return(
        <div>
            <Navbar style={{position:'fixed'}}/>
            <div style={{display:'flex',justifyContent:'flex-start',flexDirection:'column',alignItems:'center',height:'100vh',paddingTop:'100px'}}>
            
            <p>Error404</p>
            <p>Страница не найдена!</p>
            </div>
            </div>
    );
}