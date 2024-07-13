import styles from "./ShoppingComponent.module.scss";

import { useState, useEffect, Suspense } from "react";
import { storage } from "../../firebaseConfig";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { Image } from "antd";

const ShoppingComponent = () => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const folderRef = ref(storage, "images/");
        const result = await listAll(folderRef);
        const urlPromises = result.items.map((itemRef) =>
          getDownloadURL(itemRef)
        );
        const urls = await Promise.all(urlPromises);
        setImageUrls(urls);
      } catch (error) {
        console.error("Error fetching images: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  return (
    <Suspense fallback={<div>Loading.........</div>}>
      <div className={styles.shopping}>
        {imageUrls.map((image, index) => (
          <Image key={index} src={image} alt={`Shopping item ${index + 1}`} />
        ))}
      </div>
    </Suspense>
  );
};

export default ShoppingComponent;
