import {
  Button,
  Flex,
  Heading,
  Stack,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
export default function Hero() {
  return (
    <Flex
      w={"full"}
      ml={"50px"}
      h={"50vh"}
      backgroundImage={
        "url(https://images.unsplash.com/photo-1625686683171-aaeddd2370cf?ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Y2hlc3QlMjB4cmF5JTIwaW1hZ2VzfHxlbnwwfHx8fDE2NjY4ODYzMTY&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80)"
      }
      backgroundSize={"cover"}
      backgroundPosition={"center center"}
    >
      {" "}
      <Stack
        maxW={{ base: "xl", md: "3xl" }}
        textAlign={{ base: "center", md: "left" }}
        zIndex={2}
        position={"relative"}
        spacing={{ base: 8, md: 14 }}
      >
        <br />
        <br />
        <br />
        <br />{" "}
        <Text
          color={"white"}
          fontWeight={700}
          lineHeight={1.2}
          fontSize={useBreakpointValue({ base: "3xl", md: "4xl" })}
        >
          {" "}
          XRAI: Prototype system for diagnosing chest x-rays using Neural
          Networks{" "}
        </Text>{" "}
        <Text
          color={"whiteSmoke"}
          fontSize={useBreakpointValue({ base: "lg", md: "xl" })}
        >
          {" "}
          We scan user uploaded chest xray images for a variety of diseases and
          provide a through breakdown of pathology risk.{" "}
        </Text>{" "}
        <Stack direction={"row"}>
          {" "}
          <Button
            bg={"black"}
            rounded={"full"}
            color={"white"}
            _hover={{ bg: "gray.100", color: "black" }}
          >
            {" "}
            Learn More{" "}
          </Button>{" "}
          <Button
            bg={"transparent"}
            rounded={"full"}
            color={"white"}
            _hover={{ bg: "blue.400" }}
          >
            {" "}
            Contact Us{" "}
          </Button>{" "}
        </Stack>{" "}
      </Stack>{" "}
    </Flex>
  );
}
