import { StyleFunctionProps } from "@chakra-ui/theme-tools";
import { mode } from "@chakra-ui/theme-tools";
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  styles: {
    global: (props) => ({
      body: {
        bg: mode("white", "gray.900")(props),
      },
    }),
  },
  config: {
    disableTransitionOnChange: false,
  },
  initialColorMode: "dark",
  useSystemColorMode: false,
});

export default theme;
