import { Box, Text } from "@chakra-ui/react";

function GradientBox({ value }) {
  const percentage = `${value}%`;
  const backgroundGradient = `linear-gradient(to right, red 0%, white 50%, green 100%)`;

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
      >
        X
      </Text>
      <Text
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        fontWeight="bold"
        fontSize="md"
      >
        {value}%
      </Text>
    </Box>
  );
}

export default GradientBox;
