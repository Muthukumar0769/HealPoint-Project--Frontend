import { Banner } from "../../components/Header/Banner";
import { Header } from "../../components/Header/Header";
import { SeniorDoctors } from "../../components/Header/SeniorDoctors";
import { SpecialityMenu } from "../../components/Header/SpecialityMenu";

export const Home = () => {
  return (
    <main className="mt-4 overflow-hidden">
      <Header />
      <SpecialityMenu />
      <Banner />
      <SeniorDoctors />
    </main>
  );
};