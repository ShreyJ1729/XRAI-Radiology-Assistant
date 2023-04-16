const [image, setImage] = useState(null);

const handleImageChange = (event) => {
  setImage(URL.createObjectURL(event.target.files[0]));
};

const handleRemoveImage = () => {
  setImage(null);
};

return (
  <Box borderWidth="1px" borderRadius="md" p={4}>
    {image ? (
      <Box position="relative">
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
);
