import { Box, Text } from "@chakra-ui/react";

function GradientBox({ value }) {
  if (value < 5) {
    value = 5;
  }
  if (value > 95) {
    value = 95;
  }
  const percentage = `${value}%`;
  const backgroundGradient = `linear-gradient(to right, #990000 0%, white 50%, #009900 100%)`;

  return (
    <Box
      w="300px"
      h="30px"
      borderRadius="md"
      bg={backgroundGradient}
      position="relative"
    >
      <Text
        position="absolute"
        top="50%"
        left={percentage}
        transform="translate(-50%, -50%)"
        fontWeight="bold"
        fontSize="md"
        color={"white"}
        border={"3px solid black"}
        borderRadius={"100%"}
      >
        {/* font awesome x icon */}X
      </Text>
      <Text
        position="absolute"
        top="50%"
        left="-10%"
        transform="translate(-50%, -50%)"
        fontWeight="bold"
        fontSize="md"
      ></Text>
    </Box>
  );
}

export default GradientBox;
