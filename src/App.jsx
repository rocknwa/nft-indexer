import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network } from 'alchemy-sdk';
import { useState, useEffect, useCallback } from 'react';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  async function checkWalletConnection() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletConnected(true);
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setUserAddress(accounts[0]);
      } catch (error) {
        console.error('Error connecting to wallet:', error);
      }
    } else {
      console.log('No wallet detected');
    }
  }

  const getNFTsForOwner = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const config = {
        apiKey: 'wLkk9nE5kZ9x7iXZ15vBaxgjRkU9kzrp',
        network: Network.ETH_MAINNET,
      };

      const alchemy = new Alchemy(config);
      const data = await alchemy.nft.getNftsForOwner(userAddress);
      setResults(data);

      // Batch NFT metadata requests
      const tokenDataPromises = data.ownedNfts.map((nft) =>
        alchemy.nft.getNftMetadata(nft.contract.address, nft.tokenId)
      );
      const resolvedTokenData = await Promise.all(tokenDataPromises);
      setTokenDataObjects(resolvedTokenData);
      setHasQueried(true);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError('An error occurred while fetching NFTs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  // Function to handle image loading errors
  const handleImageError = (index) => {
    console.log('Error loading image for NFT at index:', index);
    // Implement retry mechanism here if needed
  };

  return (
    <Box w="100vw" p={8}>
      <Center>
        <Flex
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          <Heading mb={4} fontSize={36}>
            NFT Indexer 🖼
          </Heading>
          <Text>
            Plug in an address or ENS name and this website will return all of its NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        {!walletConnected ? (
          <Button fontSize={20} onClick={checkWalletConnection} mt={8} bgColor="blue">
            Connect Wallet
          </Button>
        ) : (
          <>
            <Heading mt={8}>Get all the ERC-721 tokens of this address:</Heading>
            <Input
              onChange={(e) => setUserAddress(e.target.value)}
              value={userAddress}
              color="black"
              w="600px"
              textAlign="center"
              p={4}
              bgColor="white"
              fontSize={24}
              mt={4}
            />
            <Button
              fontSize={20}
              onClick={getNFTsForOwner}
              mt={4}
              bgColor="blue"
              disabled={!userAddress || isLoading}
            >
              {isLoading ? <Spinner size="sm" color="white" /> : 'Fetch NFTs'}
            </Button>

            <Heading my={8}>Here are your NFTs:</Heading>

            {isLoading && <Spinner size="xl" />}
            {error && <Text color="red.500">{error}</Text>}
            {hasQueried && !isLoading && !error && (
              <SimpleGrid w="90vw" columns={4} spacing={8}>
                {results.ownedNfts.map((nft, index) => (
                  <Flex
                    key={index}
                    flexDir="column"
                    color="white"
                    bg="blue"
                    w="20vw"
                    p={4}
                    borderRadius={8}
                    boxShadow="md"
                  >
                    <Box mb={2}>
                      <b>Name:</b>{' '}
                      {tokenDataObjects[index]?.title || 'No Name'}
                    </Box>
                    <Image
                      src={
                        tokenDataObjects[index]?.rawMetadata?.image ||
                        'https://via.placeholder.com/200'
                      }
                      alt={'NFT Image'}
                      onError={() => handleImageError(index)} // Handle image loading errors
                      fallbackSrc="https://via.placeholder.com/200" // Fallback image
                      borderRadius={8}
                    />
                  </Flex>
                ))}
              </SimpleGrid>
            )}
          </>
        )}
      </Flex>
    </Box>
  );
}

export default App;

