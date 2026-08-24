import {
  Button,
  Html,
  Text,
  Section,
  Container,
  Heading,
  Hr,
  Link,
  Tailwind,
  Body,
} from 'react-email';

export const NewsletterConfirmEmail = ({
  name,
  confirmLink,
  unsubscribeLink,
}: {
  name?: string;
  confirmLink: string;
  unsubscribeLink: string;
}) => (
  <Html>
    <Tailwind>
      <Body className="bg-white font-sans text-gray-800">
        <Container className="bg-white border border-gray-200 rounded-xl p-10 max-w-xl mx-auto my-10 shadow-sm">
          <Heading className="text-2xl text-gray-800 text-center font-bold mb-6">
            Confirm Your Subscription
          </Heading>

          <Text className="text-base text-gray-600 leading-relaxed">
            Hi {name ? name : 'there'},
          </Text>

          <Text className="text-base text-gray-600 leading-relaxed mb-6">
            Thanks for joining the EditHacker newsletter! We're excited to share
            the absolute best tools, deals, and tutorials straight to your
            inbox.
          </Text>

          <Text className="text-base text-gray-600 leading-relaxed mb-6">
            Please click the button below to verify your email address and
            activate your subscription.
          </Text>

          {/* Confirm Link Button */}
          <Section className="text-center my-8">
            <Button
              href={confirmLink}
              className="bg-black text-white px-8 py-3 rounded-md text-sm font-semibold no-underline"
            >
              Confirm Subscription
            </Button>
          </Section>

          <Text className="text-sm text-gray-500 text-center mt-6">
            If the button doesn't work, copy and paste this link into your
            browser: <br />
            <Link
              href={confirmLink}
              className="text-indigo-600 underline break-all mt-2 inline-block"
            >
              {confirmLink}
            </Link>
          </Text>

          <Hr className="border-gray-200 my-8" />

          <Text className="text-xs text-gray-400 text-center leading-relaxed">
            If you didn't request this email, you can safely ignore it.
            <br />
            <br />
            Don't want to hear from us?{' '}
            <Link href={unsubscribeLink} className="text-gray-500 underline">
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default NewsletterConfirmEmail;
