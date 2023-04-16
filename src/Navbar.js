import {
  Box,
  Flex,
  useColorMode,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  Text,
  Center,
  Progress,
} from "@chakra-ui/react";
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
} from "@chakra-ui/icons";
import { NavItem } from "./constants";
import { NAV_ITEMS } from "./constants";

export default function Navbar({ navItems, stepNumber, loading }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onToggle } = useDisclosure();

  const linkColor = useColorModeValue("gray.800", "gray.200");
  const linkHoverColor = useColorModeValue("black", "white");
  const popoverContentBgColor = useColorModeValue("white", "gray.900");

  const NUM_STEPS = 4;

  return (
    <>
      <Flex
        position="fixed"
        w="100%"
        bg={useColorModeValue("#f7f7f7", "black")}
        color={useColorModeValue("gray.900", "white")}
        minH={"100px"}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={"solid"}
        borderColor={useColorModeValue("gray.200", "gray.900")}
        align={"center"}
        zIndex={1000}
      >
        <Flex
          flex={{ base: 1, md: "auto" }}
          ml={{ base: -2 }}
          display={{ base: "flex", md: "none" }}
        >
          <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            variant={"ghost"}
            aria-label={"Toggle Navigation"}
          />
        </Flex>
        <Flex
          flex={{ base: 1 }}
          justify={{ base: "center", md: "start" }}
          display={{ base: "none", md: "flex" }}
          alignItems="center"
        >
          <Text
            textAlign={useBreakpointValue({ base: "center", md: "left" })}
            fontFamily={"heading"}
            ml={8}
            fontWeight="bold"
            fontSize={"2xl"}
            color={useColorModeValue("black", "white")}
          >
            <a href="/">XRAI: Your AI Radiology Assistant</a>
          </Text>

          <Flex ml={10}>
            <DesktopNav
              linkColor={linkColor}
              linkHoverColor={linkHoverColor}
              popoverContentBgColor={popoverContentBgColor}
              navItems={navItems}
            />
          </Flex>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={"flex-end"}
          direction={"row"}
          spacing={6}
        >
          <IconButton
            fontSize={30}
            aria-label={`Switch to ${
              colorMode === "light" ? "dark" : "light"
            } mode`}
            variant={"ghost"}
            colorScheme={"pink"}
            onClick={toggleColorMode}
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          />
          {/* <Button
                      as={'a'}
                      fontSize={'sm'}
                      fontWeight={400}
                      variant={'link'}
                      href={'#'}>
                      Sign In
                  </Button>
                  <Button
                      as={'a'}
                      display={{ base: 'none', md: 'inline-flex' }}
                      fontSize={'sm'}
                      fontWeight={600}
                      color={'white'}
                      bg={'pink.400'}
                      href={'#'}
                      _hover={{
                          bg: 'pink.300',
                      }}>
                      Sign Up
                  </Button> */}
        </Stack>
      </Flex>
      <Progress
        value={(100 * stepNumber) / NUM_STEPS}
        isIndeterminate={loading}
        size="xs"
        colorScheme="pink"
        position="fixed"
        top="100px"
        w="100%"
        sx={{
          "& > div:first-child": {
            transitionProperty: "width",
          },
        }}
        zIndex={1000}
      />

      <Collapse in={isOpen} animateOpacity>
        <MobileNav
          navItems={navItems}
          linkColor={linkColor}
          linkHoverColor={linkHoverColor}
        />
      </Collapse>
    </>
  );
}

const DesktopNav = ({
  linkColor,
  linkHoverColor,
  popoverContentBgColor,
  navItems,
}) => {
  return (
    <Stack direction={"row"} spacing={10}>
      {navItems.map((navItem) => (
        <Box key={navItem.label}>
          <Popover trigger={"hover"} placement={"bottom-start"}>
            <PopoverTrigger>
              <Text
                p={2}
                fontSize={"lg"}
                fontWeight={500}
                color={linkColor}
                _hover={{
                  textDecoration: "none",
                  color: linkHoverColor,
                }}
              >
                <a href={navItem.href ?? "#"}>{navItem.label}</a>
              </Text>
            </PopoverTrigger>
            {/* 
            {navItem.children && (
              <PopoverContent
                boxShadow={"xl"}
                bg={popoverContentBgColor}
                p={4}
                rounded={"xl"}
                minW={"sm"}
              >
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )} */}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel }) => {
  return (
    <a href={href ?? "#"}>
      <Box
        role={"group"}
        display={"block"}
        p={2}
        rounded={"md"}
        _hover={{ bg: useColorModeValue("pink.50", "gray.900") }}
      >
        <Stack direction={"row"} align={"center"}>
          <Box>
            <Text transition={"all .3s ease"} fontWeight={500}>
              {label}
            </Text>
            <Text fontSize={"sm"}>{subLabel}</Text>
          </Box>
          <Flex
            transition={"all .3s ease"}
            transform={"translateX(-10px)"}
            opacity={0}
            _groupHover={{ opacity: "100%", transform: "translateX(0)" }}
            justify={"flex-end"}
            align={"center"}
            flex={1}
          >
            <Icon color={"pink.400"} w={5} h={5} as={ChevronRightIcon} />
          </Flex>
        </Stack>
      </Box>
    </a>
  );
};

const MobileNav = ({ linkColor, linkHoverColor, navItems }) => {
  return (
    <Stack
      position="fixed"
      w="100%"
      top="65px"
      bg={useColorModeValue("white", "red")}
      p={4}
      display={{ md: "none" }}
    >
      {navItems.map((navItem) => (
        <MobileNavItem
          key={navItem.label}
          {...navItem}
          linkColor={linkColor}
          linkHoverColor={linkHoverColor}
        />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({
  label,
  children,
  href,
  linkColor,
  linkHoverColor,
}) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <a href={href ?? "#"}>
        <Flex
          py={2}
          justify={"space-between"}
          align={"center"}
          _hover={{
            textDecoration: "none",
          }}
        >
          <Text fontWeight={600} color={linkColor}>
            {label}
          </Text>
          {children && (
            <Icon
              as={ChevronDownIcon}
              transition={"all .25s ease-in-out"}
              transform={isOpen ? "rotate(180deg)" : ""}
              w={6}
              h={6}
            />
          )}
        </Flex>
      </a>

      <Collapse in={isOpen} animateOpacity style={{ marginTop: "0!important" }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={"solid"}
          borderColor={useColorModeValue("gray.200", "gray.700")}
          align={"start"}
        >
          {children &&
            children.map((child) => (
              <Text
                key={child.label}
                py={2}
                color={linkColor}
                _hover={{ textDecoration: "none", color: linkHoverColor }}
              >
                <a href={child.href ?? "#"}>{child.label}</a>
              </Text>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};
