import logo from "./logo.svg";
import "./App.css";
import Navbar from "./Navbar";
import { NAV_ITEMS } from "./constants";
import { useState } from "react";
import PercentageSlider from "./PercentageSlider";
import Hero from "./Hero";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  Spacer,
  Table,
  Tbody,
  Td,
  Text,
  Tr,
  VStack,
} from "@chakra-ui/react";

function App() {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);

  const handleImageChange = (event) => {
    setImage(URL.createObjectURL(event.target.files[0]));
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  return (
    <>
      <Navbar navItems={NAV_ITEMS} loading={loading} />
      <Hero />
      <br />
      <br />
      <br />
      <br />
      <br />
      <Box borderWidth="1px" borderRadius="md" p={4}>
        {image ? (
          <Box>
            <Image src={image} alt="Uploaded image" />
            <Button
              onClick={handleRemoveImage}
              position="absolute"
              top={0}
              right={0}
              mt={2}
              mr={2}
              size="sm"
            >
              Remove
            </Button>
          </Box>
        ) : (
          <FormControl>
            <FormLabel>Upload an image</FormLabel>
            <Input type="file" onChange={handleImageChange} />
          </FormControl>
        )}
      </Box>
      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Box display={"grid"} gridTemplateColumns="2fr 1fr">
          <VStack>
            <HStack mb={4}>
              <Button>Invert Colors</Button>
              <Button>Raw Gradient Class Activation Map (GradCam++)</Button>
              <Button>Reset</Button>
            </HStack>
            <Image
              src="https://via.placeholder.com/150"
              alt="Lung image"
              width="75%"
            />
          </VStack>
          <Box>
            <Text fontSize="xl" fontWeight="bold" mb={4}>
              Pathology Risk
            </Text>
            <HStack>
              return (
              <Box>
                <Table variant="simple">
                  <Tbody>
                    {[
                      "Atelectasis",
                      "Consolidation",
                      "Edema",
                      "Emphysema",
                      "Fibrosis",
                      "Effusion",
                      "Pleural Thickening",
                      "Cardiomegaly",
                      "Mass",
                      "Hernia",
                      "Lung Opacity",
                      "Enlarged Cardiomedia.",
                    ].map((disease) => (
                      <Tr key={disease} my={10} py={10}>
                        <Td my={0} py={4}>
                          {disease}
                        </Td>
                        <Td my={0} py={0}>
                          <PercentageSlider value={10} />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              );
            </HStack>
          </Box>
        </Box>
      </Box>
      );
    </>
  );
}

export default App;
