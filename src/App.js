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
  Textarea,
  Select,
} from "@chakra-ui/react";

import axios from 'axios';


const fetchData = async (disease, input) => {
  const response = await axios.post(
    "https://api.openai.com/v1/completions",
    {
      prompt: `Given this disease ${disease}, answer this question: "${input}"`,
      model: "text-davinci-002",
      max_tokens: 50,
      n: 1,
      stop: ".",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer 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`,
      },
    }
  );

  return response.data.choices[0].text;
};

function App() {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [inp, setInp] = useState(null);
  const [rep, setRep] = useState("");

  const options = ["Atelectasis", "Consolidation", "Edema", "Emphysema", "Fibrosis",                       "Effusion",
  "Pleural Thickening",
  "Cardiomegaly",
  "Mass",
  "Hernia",
  "Lung Opacity",
  "Enlarged Cardiomedia.",]; // options for the Select component
  const [selectedOption, setSelectedOption] = useState(options[0]); // initial state is the first option
  
  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value); // update state when a new option is selected
  };


  function handleInpChange(event) {
    setInp(event.target.value);
    console.log(inp);
  }

  const handleImageChange = (event) => {
    setImage(URL.createObjectURL(event.target.files[0]));
  };

  const handleRemoveImage = () => {
    setImage(null);
  };


  async function handleClick() {
    let re2 = await fetchData(selectedOption, inp);
    setRep(re2);
  }

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


      <Select value={selectedOption} onChange={handleSelectChange}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </Select>
      <Input value={inp} onChange={handleInpChange} />
      <Button colorScheme='blue' onClick={handleClick}>Submit Question</Button>
      <Textarea value={rep}/>

    </>
  );
}

export default App;
