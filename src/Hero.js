import {
  Button,
  Flex,
  Heading,
  Img,
  Spacer,
  Stack,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
export default function Hero() {
  return (
    <Flex
      w={"80%"}
      mx="15%"
      h={"50vh"}
      backgroundImage={
        "url(https://images.unsplash.com/photo-1625686683171-aaeddd2370cf?ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Y2hlc3QlMjB4cmF5JTIwaW1hZ2VzfHxlbnwwfHx8fDE2NjY4ODYzMTY&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80)"
      }
      backgroundSize={"cover"}
      backgroundPosition={"center center"}
    >
      <Stack
        w="90%"
        textAlign={{ base: "center", md: "left" }}
        zIndex={2}
        position={"relative"}
        spacing={{ base: 8, md: 14 }}
      >
        <br />
        <br />
        <br />
        <br />
        <Text fontWeight={700} lineHeight={1.2} fontSize={40}>
          XRAI: Your Personal Radiologist Assistant
        </Text>
        <Text fontSize={25}>
          XRAI locally preprocesses and inferences user uploaded chest x-ray
          images for diseases such as Pulmonary Edema & Cystic Fibrosis,
          providing a thorough breakdown of pathology including stratified risk
          level, class activation (attention) mapping, and an LLM chatbot for
          further questions and learning.
          <br />
          <br />
          XRAI can be used by a variety of audiences, ranging from overworked
          radiologists who want to corroborate their diagnosis, patients who
          want to learn more about their diseases, and medical students who are
          in training and want to supplement their education.
          <br />
          <br />
          Try uploading an images to start. Or you can use one of the examples
          below.
        </Text>

        <Stack direction={"row"}>
          <Button
            bg={"black"}
            rounded={"full"}
            color={"white"}
            _hover={{ bg: "gray.100", color: "black" }}
            onClick={() => {
              window.open(
                "https://github.com/ShreyJ1729/XRAI-Radiology-Assistant",
                "_blank"
              );
            }}

          >
            Learn More
          </Button>
          <Button
            bg={"transparent"}
            rounded={"full"}
            _hover={{ bg: "blue.400" }}
            onClick={() => {
              window.open(
                "https://devpost.com/software/xrai",
                "_blank"
              );
            }}
          >
            Contact Us
          </Button>
        </Stack>
      </Stack>
    </Flex>
  );
}
