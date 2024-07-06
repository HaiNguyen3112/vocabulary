import styles from "./ShoppingComponent.module.scss";
import image_mau1 from "../../assest/img/mau_1.png";
import image_mau2 from "../../assest/img/mau_2.jpg";
import image_mau3 from "../../assest/img/mau_3.jpg";
import image_mau4 from "../../assest/img/mau_4.jpg";
import image_mau5 from "../../assest/img/mau_5.jpg";
import image_mau6 from "../../assest/img/mau_6.jpg";
import image_mau7 from "../../assest/img/mau_7.jpg";
import image_mau8 from "../../assest/img/mau_8.jpg";
import image_mau9 from "../../assest/img/mau_9.jpg";
import image_mau10 from "../../assest/img/mau_10.jpg";
import image_mau11 from "../../assest/img/mau_11.jpg";
import image_mau12 from "../../assest/img/mau_12.jpg";
import image_mau13 from "../../assest/img/mau_13.jpg";

const images = [
  image_mau1,
  image_mau2,
  image_mau3,
  image_mau4,
  image_mau5,
  image_mau6,
  image_mau7,
  image_mau8,
  image_mau9,
  image_mau10,
  image_mau11,
  image_mau12,
  image_mau13,
];

const ShoppingComponent = () => {
  return (
    <div className={styles.shopping}>
      {images.map((image, index) => (
        <img key={index} src={image} alt={`Shopping item ${index + 1}`} />
      ))}
    </div>
  );
};

export default ShoppingComponent;
