import { Banner } from "../../components/Header/Banner";
import { Header } from "../../components/Header/Header";
import { SeniorDoctors } from "../../components/Header/SeniorDoctors";
import { SpecialityMenu } from "../../components/Header/SpecialityMenu";
import usePageTitle from "../../hooks/usePageTitle";

export const Home = () => {
  usePageTitle("Home");
  return (
    <main className="mt-2 overflow-hidden">
      <Header />
      <SpecialityMenu />
      <Banner />
      <SeniorDoctors />
    </main>
  );
};